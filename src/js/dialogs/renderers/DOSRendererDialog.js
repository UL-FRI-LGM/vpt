// #package js/main

// #include ../AbstractDialog.js

// #include ../../../uispecs/renderers/DOSRendererDialog.json

class DOSRendererDialog extends AbstractDialog {

constructor(renderer, options) {
    super(UISPECS.DOSRendererDialog, options);

    this._renderer = renderer;

    this._handleChange = this._handleChange.bind(this);

    this._binds.steps.addEventListener('input', this._handleChange);
    this._binds.slices.addEventListener('input', this._handleChange);
    this._binds.occlusionScale.addEventListener('input', this._handleChange);
    this._binds.occlusionDecay.addEventListener('change', this._handleChange);
}

_handleChange() {
    this._renderer.steps = this._binds.steps.getValue();
    this._renderer.slices = this._binds.slices.getValue();
    this._renderer.occlusionScale = this._binds.occlusionScale.getValue();
    this._renderer.occlusionDecay = this._binds.occlusionDecay.getValue();
    this._renderer.reset();
}

}
