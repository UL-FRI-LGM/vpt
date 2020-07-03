// #package js/main

// #include ../utils
// #include UIObject.js

class SliderMultiTrack extends UIObject {

    constructor(options) {
        super(TEMPLATES.SliderMultiTrack, options);

        Object.assign(this, {
            value: 0,
            value2: 0,
            value3: 0,
            min: 0,
            max: 100,
            step: 1,
            enabled: true,
            logarithmic: false,
            focused: false,
            limitLeft: 0,
            limitRight: 100,
            histogram: [],
            histColumns: 10
        }, options);

        this._handleMouseDown = this._handleMouseDown.bind(this);
        this._handleMouseUp = this._handleMouseUp.bind(this);
        this._handleMouseMove = this._handleMouseMove.bind(this);
        this._handleWheel = this._handleWheel.bind(this);

        this.clearHistogram();
        this.createHistogramElements();

        this._updateUI();

        this._element.addEventListener('mousedown', this._handleMouseDown);
        this._element.addEventListener('wheel', this._handleWheel);

        this.enable();
    }

    isDisable() {
        return !this.enabled;
    }

    disable() {
        this.enabled = false;
        this._binds.button.classList.toggle('disabled', true);
    }

    enable() {
        this.enabled = true;
        this._binds.button.classList.toggle('disabled', false);
    }

    destroy() {
        document.removeEventListener('mouseup', this._handleMouseUp);
        document.removeEventListener('mousemove', this._handleMouseMove);

        super.destroy();
    }
    setValue(value) {
        if (!this.enabled) {
            return;
        }

        var newValue = CommonUtils.clamp(value, this.min, this.max);
        newValue = CommonUtils.clamp(newValue, this.limitLeft, this.limitRight);

        this.value = newValue;

        this._binds.value.value = this.value;

        this._updateUI();

        if (this.focused) {
            this.trigger('change');
        }
    }

    setValue2(value) {
        // there is no 'disabled' test because it's just state visualization
        this.value2 = CommonUtils.clamp(value, this.min, this.max);
        this._updateUI();
    }

    setValue3(value) {
        // there is no 'disabled' test because it's just state visualization
        this.value3 = CommonUtils.clamp(value, this.min, this.max);
        this._updateUI();
    }

    setLimitLeft(value) {
        this.limitLeft = value;
        this._updateUI();
    }

    setLimitRight(value) {
        this.limitRight = value;
        this._updateUI();
    }

    setMaxValue(value) {
        this.max = value;
        this._updateUI();
    }
    getMaxValue() {
        return this.max;
    }
    getLimitLeft() {
        return this.limitLeft;
    }

    getLimitRight() {
        return this.limitRight;
    }
    _updateUI() {
        if (this.logarithmic) {
            const logmin = Math.log(this.min);
            const logmax = Math.log(this.max);
            const ratio = (Math.log(this.value) - logmin) / (logmax - logmin) * 100;
            this._binds.button.style.marginLeft = ratio + '%';
        } else {
            const ratio = (this.value - this.min) / (this.max - this.min) * 100;
            this._binds.button.style.marginLeft = ratio + '%';

            const ratio2 = (this.value2 - this.min) / (this.max - this.min) * 100;
            this._binds.track2.style.width = ratio2 + '%';

            const ratio3 = (this.value3 - this.min) / (this.max - this.min) * 100;
            this._binds.track3.style.width = ratio3 + '%';

            if (this.limitLeft > this.min) {
                const ratio = (this.limitLeft - this.min) / (this.max - this.min) * 100;
                this._binds.limitLeft.style.width = ratio + '%';
            }
            else {
                this._binds.limitLeft.style.width = '0%';
            }

            if (this.limitRight < this.max) {
                const ratio = (this.limitRight - this.min) / (this.max - this.min) * 100;
                this._binds.limitRight.style.left = ratio + '%';
                this._binds.limitRight.style.width = (100 - ratio) + '%';
            }
            else {
                this._binds.limitRight.style.left = '0%';
                this._binds.limitRight.style.width = '0%';
            }

            this.updateHistogram();
        }
    }

    getValue() {
        return this.value;
    }

    _setValueByEvent(e) {
        const rect = this._binds.container.getBoundingClientRect();
        const ratio = (e.pageX - rect.left) / (rect.right - rect.left);
        if (this.logarithmic) {
            const logmin = Math.log(this.min);
            const logmax = Math.log(this.max);
            const value = Math.exp(logmin + ratio * (logmax - logmin));
            this.setValue(value);
        } else {
            const value = this.min + ratio * (this.max - this.min);
            this.setValue(value);
        }
    }

    _handleMouseDown(e) {
        this.focused = true;

        if (!this.enabled) {
            return;
        }

        document.addEventListener('mouseup', this._handleMouseUp);
        document.addEventListener('mousemove', this._handleMouseMove);
        this._setValueByEvent(e);
    }

    _handleMouseUp(e) {
        this.focused = false;

        if (!this.enabled) {
            return;
        }

        document.removeEventListener('mouseup', this._handleMouseUp);
        document.removeEventListener('mousemove', this._handleMouseMove);
        this._setValueByEvent(e);
    }

    _handleMouseMove(e) {
        e.preventDefault();

        if (!this.enabled) {
            return;
        }

        this._setValueByEvent(e);
    }

    _handleWheel(e) {
        if (!this.enabled) {
            return;
        }

        let wheel = e.deltaY;
        if (wheel < 0) {
            wheel = 1;
        } else if (wheel > 0) {
            wheel = -1;
        } else {
            wheel = 0;
        }

        const delta = this.logarithmic ? this.value * this.step * wheel : this.step * wheel;
        this.setValue(this.value + delta);
    }

    clearHistogram() {
        this.histogram = [];
        for (var i = 0; i < this.histColumns; i++) {
            this.histogram.push(0);
        }

        //this.setHistogram([123, 56, 4, 4, 4, 3, 0, 1, 2, 2, 3, 2, 7, 4, 3, 6, 4, 5, 0, 6, 0]);        
    }

    createHistogramElements() {
        var hist = this._element.querySelector('.histogram');
        while (hist.firstChild) {
            hist.removeChild(hist.firstChild);
        }

        for (var i = 0; i < this.histogram.length; i++) {
            var div = document.createElement("div");
            div.className = "hist-val";
            hist.appendChild(div);
        }
    }

    updateHistogram() {
        var hist = this._element.querySelector('.histogram');

        var maxHistValue = 0;
        for (var i = 0; i < this.histogram.length; i++) {
            maxHistValue = Math.max(maxHistValue, this.histogram[i]);
        }

        //maxHistValue = Math.log10(maxHistValue);

        for (var i = 0; i < this.histogram.length; i++) {
            var value = this.histogram[i];
            var div = hist.children[i];
            //var height = ((Math.log10(value) / maxHistValue) * 50 + 1);
            var height = (value / maxHistValue) * 50 + 1;
            div.style.height = height + "%";
            div.style.top = (50 - height - 6) + "%";
            div.style.width = (100 / this.histColumns) + "%";            
        }
    }

    setHistogram(histogram) {

        var tmp = [];

        for (var key in histogram) {
            tmp.push(histogram[key]);
        }

        if (histogram.length > this.histogram.length) {
            var sparse = Math.ceil(histogram.length / this.histogram.length);

            var counter = 0;
            for (var i = 0; i < tmp.length; i += sparse) {
                var sum = 0;
                for(var j = 0; j < sparse; j++) {
                    if(i + j < tmp.length) {
                        sum += tmp[i + j];
                    }
                }
                this.histogram[counter++] = sum;
            }   
                
        } else if (histogram.length < this.histogram.length) {
            // TODO: implement
        } else {
            this.histogram = histogram;
        }
    }

}
