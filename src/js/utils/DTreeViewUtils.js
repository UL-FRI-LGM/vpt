// #package js/main

function test() {
    var data= [
        {
                    text: "Type", 
                    expanded: true, 
                    iconCls: "fa fa-folder", 
                },
                {
                    text: "Orientation", 
                    expanded: true, 
                    iconCls: "fa fa-folder", 
                },
                {
                    text: "Size", 
                    expanded: true, 
                    iconCls: "fa fa-folder", 
                }
        ];
jQuery(function ($) {
    $("#treeview").shieldTreeView({
        dragDrop: true,
        dragDropScope: "treeview-dd-scope",
        dataSource: data,
        events: {
            droppableOver: function(e) {
                if (!e.valid) {
                    // if an invalid draggable item is over a tree item,
                    // re-validate it - i.e. if it is a doc-item, allow the drop
                    if ($(e.draggable).hasClass('doc-item')) {
                        e.valid = true;
                    }
                }
            },
            drop: function (e) {
                var valid = e.valid;
                if (!valid) {
                    // if not valid, it means something different than a tree node
                    // is being dropped - in this case, check for a doc item and 
                    // set valid to true if so
                    if ($(e.draggable).hasClass('doc-item')) {
                        valid = true;
                    }
                }
                if (valid) {
                    if (e.sourceNode) {
                        // dropping a treeview node - move it
                        this.append(e.sourceNode, e.targetNode);
                    }
                    else {
                        // dragging a doc item - insert a new one
                        // and remove the dragged element
                        this.append({ text: $(e.draggable).html() }, e.targetNode);
                        $(e.draggable).remove();
                    }
                    // disable the animation
                    e.skipAnimation = true;
                }
            }
        }
    });
    // setup drag and drop handlers for the elements outside the treeview
    $(".doc-item").shieldDraggable({
        scope: "treeview-dd-scope",
        helper: function() { 
            return $(this.element).clone().appendTo(document.body);
        },
        events: {
            stop: function (e) {
                // always cancel the movement of the item;
                // if a drop over a valid target ocurred, we will handle that 
                // in the respective drop handler
                e.preventDefault();
            }
        }
    });
    // handle drop on the trash can
    $(".item-trash").shieldDroppable({
        scope: "treeview-dd-scope",
        hoverCls: "item-trash-dropover",
        tolerance: "touch",
        events: {
            drop: function (e) {
                if ($(e.draggable).hasClass('sui-treeview-item-text')) {
                    // dropped a treeview item - delete it
                    $("#treeview").swidget("TreeView").remove($(e.draggable).closest('.sui-treeview-item'));
                }
                else {
                    // dropped a doc-item, just delete it from the DOM
                    $(e.draggable).remove();
                }
                // disable animation of the droppable, so that it
                // does not get animated if cancelled
                e.skipAnimation = true;
            }
        }
    });
});
}