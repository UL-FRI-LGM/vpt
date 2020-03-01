// #package js/main

// #include UIObject.js

// #include ../../html/ui/TreeView.html

class TreeView extends UIObject {

constructor(options) {
    super(TEMPLATES.TreeView, options);

    Object.assign(this, {
        label      : ''
    }, options);

}

setEnabled(enabled) {
    super.setEnabled(enabled);
}

}
