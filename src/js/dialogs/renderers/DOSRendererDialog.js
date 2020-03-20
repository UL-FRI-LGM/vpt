// #package js/main

// #include ../AbstractDialog.js
// #include ../../TransferFunctionWidget.js

// #include ../../../uispecs/renderers/DOSRendererDialog.json

class DOSRendererDialog extends AbstractDialog {

constructor(renderer, options) {
    super(UISPECS.DOSRendererDialog, options);

    this._renderer = renderer;

    this._handleChange = this._handleChange.bind(this);
    this._handleTFChange = this._handleTFChange.bind(this);

    this._binds.steps.addEventListener('input', this._handleChange);
    this._binds.slices.addEventListener('input', this._handleChange);
    this._binds.occlusionScale.addEventListener('input', this._handleChange);
    this._binds.occlusionDecay.addEventListener('change', this._handleChange);
    this._binds.visibility0.addEventListener('change', this._handleChange);
    this._binds.visibility1.addEventListener('change', this._handleChange);
    this._binds.visibility2.addEventListener('change', this._handleChange);
    this._binds.visibility3.addEventListener('change', this._handleChange);
    this._binds.visibility4.addEventListener('change', this._handleChange);
    this._binds.visibility5.addEventListener('change', this._handleChange);
    this._binds.visibility6.addEventListener('change', this._handleChange);
    this._binds.visibility7.addEventListener('change', this._handleChange);

    this._tfwidget = new TransferFunctionWidget();
    this._binds.tfcontainer.add(this._tfwidget);
    this._tfwidget.addEventListener('change', this._handleTFChange);
}

destroy() {
    this._tfwidget.destroy();
    super.destroy();
}

_handleChange() {
    this._renderer.steps = this._binds.steps.getValue();
    this._renderer.slices = this._binds.slices.getValue();
    this._renderer.occlusionScale = this._binds.occlusionScale.getValue();
    this._renderer.occlusionDecay = this._binds.occlusionDecay.getValue();
    this._renderer.visibility0 = this._binds.visibility0.getValue();
    this._renderer.visibility1 = this._binds.visibility1.getValue();
    this._renderer.visibility2 = this._binds.visibility2.getValue();
    this._renderer.visibility3 = this._binds.visibility3.getValue();
    this._renderer.visibility4 = this._binds.visibility4.getValue();
    this._renderer.visibility5 = this._binds.visibility5.getValue();
    this._renderer.visibility6 = this._binds.visibility6.getValue();
    this._renderer.visibility7 = this._binds.visibility7.getValue();
    this._renderer.reset();
}

_handleTFChange() {
    this._renderer.setTransferFunction(this._tfwidget.getTransferFunction());
    this._renderer.reset();
}

}
