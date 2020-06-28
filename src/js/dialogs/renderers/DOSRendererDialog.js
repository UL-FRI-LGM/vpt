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

    this._binds.useCameraAsMS.addEventListener('change', this._handleChange);
    this._binds.removalSelect.addEventListener('change', this._handleChange);
    this._binds.ks.addEventListener('change', this._handleChange);
    this._binds.kt.addEventListener('change', this._handleChange);
    this._binds.meltingPos.addEventListener('change', this._handleChange);
    this._binds.removalAutoUpdate.addEventListener('change', this._handleChange);
    this._binds.useShadingTerm.addEventListener('change', this._handleChange);
    //this._binds.useAccOpacityTerm.addEventListener('change', this._handleChange);
    this._binds.useDistTerm.addEventListener('change', this._handleChange);

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

    const removalMethod=this._binds.removalSelect.getValue()
    if( removalMethod =='depth')
    {
        this._renderer._removalSelect = 0;
    }
    else if( removalMethod =='CPF')
    {
        this._renderer._removalSelect = 1;
    }
    else //if( this._binds.removalSelect=='Random')
        this._renderer._removalSelect = 2;

    this._renderer._useCameraAsMS = this._binds.useCameraAsMS.isChecked();
    this._renderer._removalAutoUpdate = this._binds.removalAutoUpdate.isChecked();
    this._renderer._useShadingTerm = this._binds.useShadingTerm.isChecked();
    //this._renderer._useAccOpacityTerm = this._binds.useAccOpacityTerm.isChecked();
    this._renderer._useDistTerm = this._binds.useDistTerm.isChecked();

    const position = this._binds.meltingPos.getValue();
    this._renderer._meltingSourcePos[0] = position.x;
    this._renderer._meltingSourcePos[1] = position.y;
    this._renderer._meltingSourcePos[2] = position.z;
    this._renderer.reset(); 
}

_handleTFChange() {
    this._renderer.setTransferFunction(this._tfwidget.getTransferFunction());
    this._renderer.reset();
}

}
