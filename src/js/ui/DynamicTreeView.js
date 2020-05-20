// #package js/main

// #include UIObject.js

// #include ../../html/ui/DynamicTreeView.html

class DynamicTreeView extends UIObject {

    constructor(options) {
        super(TEMPLATES.DynamicTreeView, options);

        Object.assign(this, {
            label: ''
        }, options);

        this.nodes = [];

        this.headerId = "property-tree-header";
        this.containerId = "property-tree-container";
    }

    createHeader(properties) {
        var _this = this;

        var header = document.getElementById(this.headerId);
        while (header.firstChild) {
            header.removeChild(header.lastChild);
        }

        var selectWrapper = this.createElement("div");
        var select = this.createElement("select");
        for (var i = 0; i < properties.length; i++) {
            var prop = properties[i];
            var option = this.createElement("option");
            option.innerText = prop.text;
            option.value = prop.text;
            select.appendChild(option);
        }
        selectWrapper.appendChild(select);
        header.appendChild(selectWrapper);

        var buttonWrapper = this.createElement("div", "button");
        var addButton = this.createElement("input");
        addButton.type = "button";
        addButton.onclick = function () {
            var value = select.options[select.selectedIndex].value;

            // TODO: implement enum values
            _this.addFloatProperty(value);
        };
        addButton.value = "Add";
        buttonWrapper.appendChild(addButton);
        header.appendChild(buttonWrapper);

        buttonWrapper = this.createElement("div", "button");
        var collapseAllButton = this.createElement("input");
        collapseAllButton.type = "button";
        collapseAllButton.onclick = function () {
            _this.collapseAll();
        };
        collapseAllButton.value = "Collapse";
        buttonWrapper.appendChild(collapseAllButton);
        header.appendChild(buttonWrapper);

        buttonWrapper = this.createElement("div", "button");
        var expandAllButton = this.createElement("input");
        expandAllButton.type = "button";
        expandAllButton.onclick = function () {
            _this.expandAll();
        };
        expandAllButton.value = "Expand";
        buttonWrapper.appendChild(expandAllButton);
        header.appendChild(buttonWrapper);

        buttonWrapper = this.createElement("div", "button");
        var jsonButton = this.createElement("input");
        jsonButton.type = "button";
        jsonButton.onclick = function () {
            var json = _this.getJSON();
            console.log(JSON.stringify(json));
        };
        jsonButton.value = "JSON";
        buttonWrapper.appendChild(jsonButton);
        header.appendChild(buttonWrapper);
    }

    setProperties(properties) {
        var select = this.createElement("select");

    }

    setEnabled(enabled) {
        super.setEnabled(enabled);
        this._binds.input.disabled = !enabled;

    }

    addEnumProperty(name, values) {
        var node = this.addPropertyNode(name);

        this.addEnum(node, values);
    }

    addFloatProperty(name, min = 0, max = 100) {
        var node = this.addPropertyNode(name);

        this.addRange(node, min, max);
    }

    addPropertyNode(name) {
        var tree = document.getElementById(this.containerId);

        var node = this.createNodeDiv(name);
        tree.appendChild(node);

        return node;
    }

    createNodeDiv(property) {
        var _this = this;

        var node = _this.createElement("div", "property-tree-node draggable", "node_" + _this.nodes.length);
        node.draggable = true;
        node.addEventListener('dragstart', function (ev) {            
            ev.dataTransfer.setData("text/plain", ev.target.id);
        });
        node.addEventListener('drop', function (ev) {
            ev.preventDefault();
            var data = ev.dataTransfer.getData("text/plain"); 
            var source = document.getElementById(data);           
            var target = ev.target;

            if(target !== null && source != target.parentElement) {
                let subnodes = target.parentElement.querySelector('.property-subnodes-wrapper');
                subnodes.appendChild(source);
            }
        });
        node.addEventListener('dragover', function (ev) {            
            ev.preventDefault();
        });
        _this.nodes.push(node);

        var header = _this.createElement("div", "property-header bottom-border");
        node.appendChild(header);

        var name = _this.createElement("div", "property-name");
        name.innerText = property;
        header.appendChild(name);

        var collapseButton = _this.createElement("div", "property-collapse-button right-button");
        collapseButton.onclick = function () {
            if (_this.isCollapsed(node)) {
                _this.expand(node);
            } else {
                _this.collapse(node);
            }
        };
        header.appendChild(collapseButton);

        var deleteButton = _this.createElement("div", "property-delete-button delete-button");
        deleteButton.onclick = function () {
            var node = collapseButton.parentNode.parentNode;
            var parent = node.parentNode;

            parent.removeChild(node);
        };
        header.appendChild(deleteButton);

        var values = _this.createElement("div", "property-values-wrapper collapsed");
        node.appendChild(values);

        var subnodes = _this.createElement("div", "property-subnodes-wrapper");
        node.appendChild(subnodes);

        return node;
    }

    addRange(node, minValue = 0, maxValue = 100) {
        var _this = this;

        var range = _this.createElement("div", "property-range");

        var label = _this.createElement("div", "property-range-label");
        label.innerText = "Range:";
        range.appendChild(label);

        var min = _this.createElement("input", "property-range-min");
        min.type = "number";
        min.value = minValue;
        range.appendChild(min);

        var max = _this.createElement("input", "property-range-max");
        max.type = "number";
        max.value = maxValue;
        range.appendChild(max);

        var addButton = _this.createElement("div", "property-range-add-button add-button");
        addButton.onclick = function () {
            _this.addRange(node);
        };
        range.appendChild(addButton);

        let values = node.querySelector('.property-values-wrapper');
        if (values.childElementCount > 0) {
            var deleteButton = _this.createElement("div", "property-range-delete-button delete-button");
            deleteButton.onclick = function () {
                var parent = this.parentNode.parentNode;

                parent.removeChild(range);
            };
            range.appendChild(deleteButton);
        }

        values.appendChild(range);
    }

    addEnum(node, values) {
        var _this = this;
        var enumValue = _this.createElement("div", "property-enum");

        var label = _this.createElement("div", "property-enum-label");
        label.innerText = "Option(s):";
        enumValue.appendChild(label);

        var select = _this.createElement("select");
        select.multiple = true;
        for (var i = 0; i < values.length; i++) {
            var option = _this.createElement("option");
            option.value = values[i];
            option.innerText = values[i];
            select.appendChild(option);
        }
        enumValue.appendChild(select);

        let valuesWrapper = node.querySelector('.property-values-wrapper');
        valuesWrapper.appendChild(enumValue);
    }

    createElement(type, className = null, id = null) {
        var elem = document.createElement(type);

        if (className != null) {
            elem.className = className;
        }

        if (id != null) {
            elem.id = id;
        }

        return elem;
    }

    addSubNode(parent, node) {
        let subnodes = parent.querySelector('.property-subnodes-wrapper');
        subnodes.appendChild(node);
    }

    isCollapsed(node) {
        let values = node.querySelector('.property-values-wrapper');
        return values.className.indexOf("collapsed") > 0;
    }

    expand(node) {
        if (this.isCollapsed(node)) {
            let header = node.querySelector('.property-header');
            let values = node.querySelector('.property-values-wrapper');
            let collapseButton = node.querySelector('.property-collapse-button');

            header.classList.toggle("bottom-border", false);
            values.classList.toggle("collapsed", false);
            collapseButton.classList.toggle("right-button", false);
            collapseButton.classList.toggle("down-button", true);
        }
    }

    expandAll() {
        for (var i = 0; i < this.nodes.length; i++) {
            this.expand(this.nodes[i]);
        }
    }

    collapse(node) {
        if (!this.isCollapsed(node)) {
            let header = node.querySelector('.property-header');
            let values = node.querySelector('.property-values-wrapper');
            let collapseButton = node.querySelector('.property-collapse-button');

            header.classList.toggle("bottom-border", true);
            values.classList.toggle("collapsed", true);
            collapseButton.classList.toggle("right-button", true);
            collapseButton.classList.toggle("down-button", false);
        }
    }

    collapseAll() {
        for (var i = 0; i < this.nodes.length; i++) {
            this.collapse(this.nodes[i]);
        }
    }

    getJSON(node = null) {
        if (node == null) {
            node = document.getElementById('property-tree-container');
            var json = [];

            for (var i = 0; i < node.childNodes.length; i++) {
                var child = node.childNodes[i];                
                var subnode = this.getJSON(child);
                json.push(subnode);
            }

            return json;
        } else {

            var values = node.querySelector('.property-values-wrapper');

            var json = {};

            json.groups = [];
            var gmin = Number.MAX_SAFE_INTEGER;
            var gmax = -Number.MAX_SAFE_INTEGER;
            var name = node.querySelector('.property-name');
            json.name = name.innerText;
            json.type = "float";
            for (var i = 0; i < values.childElementCount; i++) {
                var group = {};
                var child = values.childNodes[i];
                var label = child.querySelector('.property-range-label');
                var min = child.querySelector('.property-range-min');
                group.lo = parseInt(min.value);
                gmin = Math.min(group.lo, gmin);
                var max = child.querySelector('.property-range-max');
                group.hi = parseInt(max.value);
                group.name = "[" + group.lo + "~" + group.hi + "]";
                gmax = Math.max(group.hi, gmax);
                json.groups.push(group);
            }
            json.hi = gmax;
            json.lo = gmin;

            json.children = [];
            var subnodes = node.querySelector('.property-subnodes-wrapper');
            for (var i = 0; i < subnodes.childElementCount; i++) {
                var child = subnodes.childNodes[i];
                var subnode = this.getJSON(child);
                json.children.push(subnode);
            }

            return json;
        }
    }

    loadJSON() {
        // TODO: implement
    }

    reset() {
        var container = document.getElementById(this.containerId);
        while (container.firstChild) {
            container.removeChild(container.lastChild);
        }

        var header = document.getElementById(this.headerId);
        while (header.firstChild) {
            header.removeChild(header.lastChild);
        }
    }
}

