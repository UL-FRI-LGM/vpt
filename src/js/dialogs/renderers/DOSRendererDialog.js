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
    this._binds.colorBias.addEventListener('change', this._handleChange);
    this._binds.alphaBias.addEventListener('change', this._handleChange);
    this._binds.alphaTransfer.addEventListener('change', this._handleChange);
    this._binds.cutDepth.addEventListener('change', this._handleChange);

    this._tfwidget = new TransferFunctionWidget();
    this._binds.tfContainer.add(this._tfwidget);
    this._tfwidget.addEventListener('change', this._handleTFChange);
}

_handleChange() {
    this._renderer.steps = this._binds.steps.getValue();
    this._renderer.slices = this._binds.slices.getValue();
    this._renderer.occlusionScale = this._binds.occlusionScale.getValue();
    this._renderer.occlusionDecay = this._binds.occlusionDecay.getValue();
    this._renderer.colorBias = this._binds.colorBias.getValue();
    this._renderer.alphaBias = this._binds.alphaBias.getValue();
    this._renderer.alphaTransfer = this._binds.alphaTransfer.getValue();
    this._renderer.cutDepth = this._binds.cutDepth.getValue();

    this._renderer._ks = this._binds.ks.getValue();
    this._renderer._kt = this._binds.kt.getValue();

    const position = this._binds.position.getValue();
    this._renderer._lightPos[0] = position.x;
    this._renderer._lightPos[1] = position.y;
    this._renderer._lightPos[2] = position.z;
    this._renderer.reset();
}

_handleTFChange() {
    this._renderer.setTransferFunction(this._tfwidget.getTransferFunction());
    this._renderer.reset();
}

}
