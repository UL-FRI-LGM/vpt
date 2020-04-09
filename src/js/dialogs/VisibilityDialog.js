// #package js/main

// #include AbstractDialog.js

// #include ../../uispecs/VisibilityDialog.json

class VisibilityDialog extends AbstractDialog {

constructor(options) {
    super(UISPECS.VisibilityDialog, options);

    this.groups = [];
    this.attributes = [];

    this._registerEventListeners();
    this._addEventListeners();
}

_registerEventListeners() {
    this._handleAddGroupClick = this._handleAddGroupClick.bind(this);
}

_addEventListeners() {
    this._binds.addGroupButton.addEventListener('click', this._handleAddGroupClick);
}

_handleAddGroupClick() {
    const group = UI.create(UISPECS.VisibilityGroup);
    const { object, binds } = group;

    this._binds.groupsContainer.add(object);
    binds.spacer._element.classList.add('visibility-group');

    const controlPanel = DOMUtils.instantiate(TEMPLATES.VisibilityGroupControlPanel);
    const controlPanelButtons = DOMUtils.bind(controlPanel);
    binds.controlPanel._element.appendChild(controlPanel);

    // TODO: controlPanelButtons

    for (const attribute of this.attributes) {
        binds.attributes.addOption(attribute, attribute);
    }
}

reset() {
    this.groups = [];
}

setAttributes(attributes) {
    this.attributes = attributes;
}

}
