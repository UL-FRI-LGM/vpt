// #package js/main

// #include AbstractDialog.js

// #include ../../uispecs/TreeViewDialog.json
var isDataLoaded=false;
var isTreeTopologyCreated=false;

class TreeViewDialog extends AbstractDialog {
   
  constructor(options) {
      super(UISPECS.TreeViewDialog, options);
      this._handleCreateTreeButton=this._handleCreateTreeButton.bind(this);
      this._binds.createTreeButton.addEventListener('click', this._handleCreateTreeButton);
      TVDClass=this;
      //this.attributes = [];
      this.rules=[];
      this._createDtree=this._createDtree.bind(this);
      this._binds.resetTreeButton.addEventListener('click', this._createDtree);
     fetch("tree_layout.json").then(response => response.json()).then(data_schema=>{
      var json =data_schema['stats']['global'];
      nbProperty=0;
      for (var x in json) {
          let p=new Property(x,nbProperty);  
          var d={text: "",id:"", expanded: true,iconCls: "fa fa-folder"};
          d.text=x;
          d.id=nbProperty;
          nbProperty++;
          propertyList.push(d);
          var sumValues=0;
          var index=0;
          for (var y in json[x]) {
              let pp=new PropValue(y,json[x][y]);
              propertyJsonList.push({ "property":x, "hi":y,"lo":json[x][y],"index":index});
              index++;
              sumValues+=json[x][y];
              p.types.push(pp);
          }
          p.value=sumValues;
          propertyVList.push(p);
      }
     
      isDataLoaded=true;
   });
   fetch("tree_layout.json").then(response => response.json()).then(data_schema=>{
      var json =data_schema['elements'];
      //console.log(json);
      nbElement=0;
      for (var x in json) {
          let e=new Element(nbElement);  
          nbElement++;
          for (var y in json[x]) {
              let pp=new PropElValue(y,json[x][y])
              e.properties.push(pp);
              
             
          }
          ElementArr.push(e);
      }
    });
  }
  _getGroupOfRules()
  {
    //console.log(Htree);
    this.rules=[];
    this.extractRulesFromTree(Htree,[],[],[]);
    //console.log(this.rules);
    return this.rules;
  }
  getIndexOfPropertyValue(property,value)
  {
    var p=propertyJsonList.find(x => x.property == property && x.value == value );
    return p.index;
 
  }
  extractRulesFromTree(node,attributeList,hiList,loList)
  {
    if(node.children===null)// leaf node
    {
      var obj=new Object();
      attributeList.push(node.parent.property);
      hiList.push(node.hi);
      loList.push(node.lo);
      //--------------------------------------
      obj.attribute =JSON.parse(JSON.stringify(attributeList));;
      obj.hi =JSON.parse(JSON.stringify(hiList));  
      obj.lo =JSON.parse(JSON.stringify(loList));  
      obj.visibility = node.sliderValue;
      obj.nInstances = node.nInstances;
      obj.color = node.color;
      this.rules.push(JSON.parse(JSON.stringify(obj)));
      //---------------------------------------
      obj=[];
      attributeList.pop();
      hiList.pop();
      loList.pop();
    }
    else //if(node.children!=null)//not leaf node
    { 
      if(node.isPropClassName==false && node.isroot==false)
      {
        attributeList.push(node.parent.property);
        hiList.push(node.hi); //console.log(node.hi);
        loList.push(node.lo); //console.log(node.lo);
      }
      node.children.forEach((child) => {
        this.extractRulesFromTree(child,attributeList,hiList,loList);
  
      });
      if(node.isPropClassName==false && node.isroot==false)
      {
        attributeList.pop();
        hiList.pop();
        loList.pop();
      }

    }
  }
  setAttributes(attributes)
  {
   // this.attributes = attributes;
  this._createDtree();

  }

  _getHtree()
  {
    return Htree;
  }
  _getHtreeJsonObject()
  {
    return extractInfoTree(Htree);
  }
  _createDtree = function() {
    if(isDataLoaded==false)
    {
      console.log('tree_layout.json file is not found !! ..  ');
      return;
    }
    {
      $(".root").empty();
      jsonHArr='';
      Htree=null;
    }
    var element = document.querySelector(".sui-treeview");
    if(element!=null)
    {
      $(".sui-treeview").empty();
      //element.attributes.empty();
      element.setAttribute('id','treeview');
      element.setAttribute('class','theme-light');
    }
    var propertyListObj={text: "", expanded: true,iconCls: "fa fa-folder"};
    propertyListObj.items=[];
    propertyList.forEach(x=>{
      propertyListObj.items.push(x);
    });
    var data=[propertyListObj];
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
      $("#trash").shieldDroppable({
          scope: "treeview-dd-scope",
          hoverCls: "#trash-dropover",
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
  isTreeTopologyCreated=true;
  }
  getTreeSize()
  {
    return index_counter;
  }
  _handleCreateHierarchyJSONFile = function() {
 
   // console.log("File has been created"+jsonObject);
    saveJSON(JSON.stringify(jsonObject ));
    
  }
  _handleCreateTreeButton = function() {
    if(isDataLoaded==false)
    {
      console.log('tree_layout.json file is not found !! ..  ');
      return;
    }
    else if(isTreeTopologyCreated==false)
    {
      console.log('Tree topology should be created !! ..  ');
      return;
    }
    //var element = document.querySelector(".root");
   // if(element!=null)
    {
      $(".root").empty();
      jsonHArr='';
      Htree=null;
    }
  
    var element = document.querySelector(".sui-treeview-list");
    element.id="Dtreeview"
    var nav = getNav($('#Dtreeview'));
    function getNav($ul) {
        return $ul.children('li').map(function () {
            var $this = $(this), obj = $this.data(), $ul = $this.children('ul');
            if ($ul.length) {
                obj.child = getNav($ul)
            }
            return obj;
        }).get()
    }
  
  // console.log(nav[0].child);
   jsonHArr=createJSON(nav[0].child,jsonHArr);
   jsonView.format(jsonHArr, '.root');
   TVDClass.trigger('treeTopologyChange');
  }
  }
  function removeElement(elementId) {
    // Removes an element from the document
    var element = document.getElementById(elementId);
    element.parentNode.removeChild(element);
  }
  var index_counter=0;

  function extractInfoTree(node,index_prop)
  {
    var obj=new Object();
    if(node!==null)
    {   
      if(node.isPropClassName==false && node.isroot==false)
      {
        obj.attribute = node.parent.property;
        obj.ind = index_counter;
        index_counter++;
        obj.value = index_prop;    
        obj.visibility = node.sliderValue;
        obj.nInstances = node.nInstances;
        obj.color = node.color;
      }
      else 
        obj.attribute =null;
      if(node.children!=null)
      {
        var ind=0;
        obj.children=[];
        node.children.forEach((child) => {
          obj.children.push(extractInfoTree(child,ind));
          ind++;
        });
      }
      return obj;
    }
    return null;
  }

  function saveJSON(data) {
    //let data = "Whatever it is you want to save";
    let bl = new Blob([data], {
       type: "text/html"
    });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(bl);
    a.download = "data.json";
    a.hidden = true;
    document.body.appendChild(a);
    a.innerHTML =
       "someinnerhtml";
    a.click();
  }
  var TVDClass;
  var Htree;
  class Property  {
    constructor(name,id) {
    this.name = name;//string
    this.id=id;//int
    this.types=[]; //PropValue
    }
    }
    class PropValue  {
    constructor(hi,lo,valueIndex) {
    this.lo=lo;//int
    this.hi=hi;//int
    this.valueIndex=valueIndex;
    }
    }
    
    /*class HNode  {
    constructor(property,value) {
    this.children = [];//string
    this.property=property;//int
    this.elem=[]; //html elem
    }
    }*/
    class PropElValue  {
      constructor(property,value) {
      this.property=property;
      this.value=value;
      }
      }
    class Element  {
    constructor(id) {
    this.id = id;//string
    this.properties=[]; //PropValue
    }
    }
    let propertyList=new Array();
    let propertyVList=new Array();
    let propertyJsonList=new Array();
    let ElementArr=new Array();
    var nbProperty=0;
    var nbElement=0;
    var jsonHArr ='';
    //************************* */
    function createJSON(nav,jsonHArr)
  {
   
     jsonHArr+='{';
     for (n = 0; n< nav.length; n++) {
          jsonHArr+=createJSONHierarchyTree(nav[n],'');
          if(n+1 < nav.length)
                jsonHArr+=',';
      }
     jsonHArr+='}';
     //console.log(jsonHArr);
     return jsonHArr;
  }
  function createJSONHierarchyTree(nav,jsonHArr)
  {
          //console.log(nav);
          if (nav!== null)
          { 
              
              var name=nav['suiTreeviewListItem']['text'];
              var id=nav['suiTreeviewListItem']['id'];
              var arrTypes=propertyVList[id].types;
              var child=nav['child'];
              jsonHArr+= getString(name)+':';
              if(child.length!==0)
              { 
                  jsonHArr+='{'+getStringPropNode(child,arrTypes,0,arrTypes.length,'')+'}';
              }
              else
              {
                  jsonHArr+='['+ getStringOfPropElement(arrTypes)+']';
              }
              
          }
          return jsonHArr;
  }
  function getStringPropNode(child,arrTypes,k,length,jsonHArr)
  {
      if(k<length)
      {
          jsonHArr+=getString(arrTypes[k].hi)+':{';
          for (j = 0; j < child.length; j++) {
              jsonHArr+=createJSONHierarchyTree(child[j],'');
              //console.log(jsonHArr);
              if(j+1 < child.length)
                jsonHArr+=',';
          }
          if(k+1 < arrTypes.length){
              jsonHArr+='},';
              jsonHArr+=getStringPropNode(child,arrTypes,k+1,length,'');
          }
          else
              jsonHArr+='}';
      }
      return jsonHArr;
  }
  function getStringOfPropElement(arr)
  {
      var s=getString(arr[0].hi);
      for (i = 1; i < arr.length; i++) {
         s += ','+getString(arr[i].hi);
      }
      return s;
  }
  function getString(s)
  {
      return '\"'+s+'\"';
  }
  /*function createJSONHierarchyTree(nav,jsonHArr)
  {
          //console.log(nav);
          if (nav!== null)
          { 
              
              var name=nav['suiTreeviewListItem']['text'];
              var id=nav['suiTreeviewListItem']['id'];
              var arrTypes=propertyVList[id].types;
              var child=nav['child'];
              jsonHArr+= getString(name)+':';
              if(child.length!==0)
              { 
                  jsonHArr+='{'+getStringPropNode(child,arrTypes,0,arrTypes.length,'')+'}';
              }
              else
              {
                  jsonHArr+='{'+ getStringOfPropElement(arrTypes)+'}';
              }
              
          }
          return jsonHArr;
  }
  function getStringPropNode(child,arrTypes,k,length,jsonHArr)
  {
      if(k<length)
      {
          jsonHArr+=getString(arrTypes[k].hi)+':{';
          for (j = 0; j < child.length; j++) {
              jsonHArr+=createJSONHierarchyTree(child[j],'');
              //console.log(jsonHArr);
              if(j+1 < child.length)
                jsonHArr+=',';
          }
          if(k+1 < arrTypes.length){
              jsonHArr+='},';
              jsonHArr+=getStringPropNode(child,arrTypes,k+1,length,'');
          }
          else
              jsonHArr+='}';
      }
      return jsonHArr;
  }
  function getStringOfPropElement(arr)
  {
      var s=getString(arr[0].hi)+':'+getString(arr[0].lo);
      for (i = 1; i < arr.length; i++) {
         s += ','+getString(arr[i].hi)+':'+getString(arr[i].lo);
      }
      return s;
  }
  function getString(s)
  {
      return '\"'+s+'\"';
  }*/
  /*********************************** */
  (function() {
      'use strict';
      /**
       * Create html element
       * @param {String} storageType html element 
       * @param {Object} config
       */
      function  createElement(storageType, config) {
        const htmlElement = document.createElement(storageType);
      
        if (config === undefined) {
          return htmlElement;
        }
        
        if (config.className) {
          htmlElement.className = config.className;
        }
      
        if (config.content) {
          htmlElement.textContent = config.content;
        }
        
        if (config.children) {
          config.children.forEach((el) => {
            if (el !== null) {
              htmlElement.appendChild(el);
            }
          });
        }
      
        return htmlElement; 
      }
     
      
      /**
       * @param {Object} node
       * @return {HTMLElement}
       */
      function createExpandedElement(node) {
        const iElem = createElement('i');
        if (node.expanded) {
          iElem.className = 'fas fa-caret-down';
        } else {
          iElem.className = 'fas fa-caret-right';
        }
      
        const caretElem = createElement('div', {
          className: 'caret-icon',
          children: [iElem],
        });
      
        const handleClick = node.toggle.bind(node);
        caretElem.addEventListener('click', handleClick);
        const propertyElem = createElement('div', {
          className: 'property',
          content: node.property,
        });
        const div_Lock =createElement('div', {
          className:  'treeLock'
        });
        const div2 =createElement('div', {
          className: 'lock unlocked'
        });
        const handleLockChange = node.LockChange.bind(node);
        div2.addEventListener('click', handleLockChange);
        div_Lock.appendChild(div2);

        
        //---------------New Slider--------------------------------
        //---------------New Slider--------------------------------
        node.sliderObj = UI.create({
          "type": "slider-multi-track",
          "bind": "sliderChange",
          "value": 99.999,
          "min": 0.0001,
          "max": 99.999,
          "step": 1.000
        });
        
        const div_slider=node.sliderObj.object._element;
        
        const handleSliderChange = node.sliderChange.bind(node);
        node.sliderObj.binds.sliderChange.addEventListener('change', handleSliderChange);
        //--------------------------------------------------------
       
      
  
        const div_colorChooser =createElement('div', {
          className:  'treeColor'
        });
        const div4 =createElement('input', {
          className: 'primary_color'
        });
        div4.setAttribute('type',"color");
        div4.setAttribute('data-bind',"input");
        div4.setAttribute('value',"#808080");
        const handleColorChange = node.ColorChange.bind(node);
        div4.addEventListener('change', handleColorChange);
        div_colorChooser.appendChild(div4);
        let lineChildren;
        if( node.isroot==true )//|| node.parent.isroot==true)
        {
          //lineChildren = [caretElem,typeElem]
          lineChildren = [caretElem,propertyElem]
        }
        else if (node.property === null) {
          //lineChildren = [caretElem,typeElem];//,div_slider,div_Lock]
          lineChildren = [caretElem,propertyElem,div_slider,div_colorChooser,div_Lock];
        } else {
          //lineChildren = [caretElem,propertyElem];//,div_slider,div_Lock]
          lineChildren = [caretElem,propertyElem,div_slider,div_colorChooser,div_Lock];
        }
      
        const lineElem = createElement('div', {
          className: 'line',
          children: lineChildren
        });
      
        if (node.depth > 0) {
          lineElem.style = 'margin-left: ' + node.depth * 20 + 'px;';
        }
        return lineElem;
      }
      function clone(obj) {
        if (null == obj || "object" != typeof obj) return obj;
        var copy = new obj.constructor();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
        }
        return copy;
    }
      /**
       * @param {Object} node
       * @return {HTMLElement}
       */
      function createNotExpandedElement(node) {
        const caretElem = createElement('div', {
          className: 'empty-icon',
        });
      
        const propertyElem = createElement('div', {
          className: 'property',
          content: node.property
        });
        const div_Lock =createElement('div', {
          className:  'treeLock'
        });
        const div2 =createElement('div', {
          className: 'lock unlocked'
        });
        const handleLockChange = node.LockChange.bind(node);
        div2.addEventListener('click', handleLockChange);
        div_Lock.appendChild(div2);


        //---------------New Slider--------------------------------
        node.sliderObj = UI.create({
          "type": "slider-multi-track",
          "bind": "sliderChange",
          "value": 99.999,
          "min": 0.0001,
          "max": 99.999,
          "step": 1.000
        });
        
        const div_slider=node.sliderObj.object._element;
        
        const handleSliderChange = node.sliderChange.bind(node);
        node.sliderObj.binds.sliderChange.addEventListener('change', handleSliderChange);
        //--------------------------------------------------------
        const div_colorChooser =createElement('div', {
          className:  'treeColor'
        });
        const div4 =createElement('input', {
          className: 'primary_color'
        });
        div4.setAttribute('type',"color");
        div4.setAttribute('value',"#808080");
        const handleColorChange = node.ColorChange.bind(node);
        div4.addEventListener('change', handleColorChange);
        div4.setAttribute('data-bind',"input");
        //const handleLockChange = node.LockChange.bind(node);
        //div4.addEventListener('click', handleLockChange);
        div_colorChooser.appendChild(div4);
        var arr=[caretElem, propertyElem,div_slider,div_colorChooser,div_Lock];
        const lineElem = createElement('div', {
          className: 'line',
          children: arr
        });
      
        if (node.depth > 0) {
          lineElem.style = 'margin-left: ' + node.depth * 20 + 'px;';
        }
      
        return lineElem;
      }
      
      
      /**
       * create tree node
       * @return {Object}
       */
      function createNode() {
        return {
          property: null,
          nInstances: 0,
          visInstances: 0,
          occludedInstance:0,
          sliderValue: 100,
          minSliderValue: 0,
          maxSliderValue:100,
          lo: 0,
          hi:0,
          color:'#808080',//gray
          elem: null,
          parent: null,
          children: null,
          expanded: false,
          storageType: null,
          depth: 0,
          sliderObj:null,
          //control:null,
          //HIcontrol:[],
          //elementsList:[],
          isDisabled:false,
          isPropClassName:false,
         // isPropertyTree:false,
          isroot:false,
          isEmpty:false,
       //   hasLocked: false,
        //  hasSlider: false,
          setCaretIconRight() {
            const icon = this.elem.querySelector('.fas');
            icon.classList.replace('fa-caret-down', 'fa-caret-right');
          },
      
          setCaretIconDown() {
            const icon = this.elem.querySelector('.fas');
            icon.classList.replace('fa-caret-right', 'fa-caret-down');
          },
      
          hideChildren() {
            if (this.children !== null) {
              this.children.forEach((item) => {
                item.elem.classList.add('hide');
                if (item.expanded) {
                  item.hideChildren();
                }
              });
            }
          },
      
          showChildren() {
            if (this.children !== null) {
              this.children.forEach((item) => {
                item.elem.classList.remove('hide');
                if (item.expanded) {
                  item.showChildren();
                }
              });
            }
          },
      
          toggle: function() {
            if (this.expanded) {
              this.expanded = false;
              this.hideChildren();
              this.setCaretIconRight();
            } else {
              this.expanded = true;
              this.showChildren();
              this.setCaretIconDown();
            }
          },
          sliderChange: function() {
            if(this.isDisabled!==true)
            {
              if(exceedMaxRange(this)==true)
              {
                setSliderValue(this,this.maxSliderValue);
              }
              else if(exceedMinRange(this)==true)
              {
                setSliderValue(this,this.minSliderValue);
              }
              //=========================
              //if(isSliderUpdated==true)
              {
                this.sliderValue =getSliderValue(this);
               // console.log(this.sliderValue );
                var prevCount=this.visInstances;
                updateCountFromSliderValue(this);
                updateSliderTracks(this);

                var amount= this.visInstances-prevCount;
                updateParentsSliderCountValues(this.parent);
                if(amount>0)
                    increaseChildrenSliderCountValues(this,amount);
                else
                    decreaseChildrenSliderCountValues(this,amount*-1);
                TVDClass.trigger('treeSliderChange');
                
               // console.log(this);
              }
              
            }
            else
            {
              //console.log('illegal change in the slider..');
            }
          },
          /*onHandleSliderClick:function(){
  
          },*/
          ColorChange:function()
          {
              this.color=(getColor(this)).value;
              updateChildrenColorValue(this,this.color);
              TVDClass.trigger('treeSliderChange');
          },
          LockChange:function(){
            if(this.isEmpty==false)
            {
                if(this.isDisabled==false)
                {
                  lockedNode(this);
                  lockedChildren(this);
                  changeParentsMinMaxRange(this.parent);
                }
                else
                {
                  unlockedNode(this);
                  unlockedParents(this.parent);
                  //changeMinMaxRange(this.parent);
                }
              }
          }
        }
      }
      function getSliderValue(node)
      {
        return node.sliderObj.object.getValue();
      }
      function lockedNode(node)
      {
        var element = getLockElement(node);
        element.className='lock';
        //$(node.sliderObj).bootstrapSlider("disable");
        node.isDisabled=true;
        node.minSliderValue=node.sliderValue;
        node.maxSliderValue=node.sliderValue;
      }
      function unlockedNode(node)
      {
        var element = getLockElement(node);
        element.className='lock unlocked';
       //$(node.sliderObj).bootstrapSlider("enable");
        node.isDisabled=false;
        computeMinMaxRange(node);
      }
      function updateSliderTracks(node)
      {
        node.occludedInstance=10;// Just for test;
        node.sliderObj.object.setValue3(node.occludedInstance);
        node.sliderObj.object.setValue2(100-getSliderValue(node));

      }
      function exceedMinRange(node)
      {
        var sliderVal =getSliderValue(node);
        //check sliders total if greater than 150 and re-update slider 
        if (sliderVal< node.minSliderValue) {
            return true;
        }
        else
            return false;
      }
      function exceedMaxRange(node)
      {
        var sliderVal =getSliderValue(node);
        if (sliderVal > node.maxSliderValue) {
            //setSliderValue(node,node.maxSliderValue);
            return true;
        }
        else
            return false;
      }
      function changeParentsMinMaxRange(node)
      {
        if(node.isroot!=true)
        {
          computeMinMaxRange(node);
          changeParentsMinMaxRange(node.parent);
        }
      }
      function computeMinMaxRange(node)
      {
        if(node.children!=null)
        {
          var min=0;
          var max=0;
          node.children.forEach((item) => {
                min+=item.minSliderValue*(item.nInstances/item.parent.nInstances);
                max+=item.maxSliderValue*(item.nInstances/item.parent.nInstances);
          });
          if(node.children[0].isPropClassName==true)
          {
            min=min/node.children.length;
            max=max/node.children.length;
          }
          node.minSliderValue=min;
          node.maxSliderValue=max;
        }
        else
        {
          node.minSliderValue=0;
          node.maxSliderValue=100;
        }
      }
      function updateCountFromSliderValue(node)
      {
        var newValue=(node.sliderValue*node.nInstances)/100;
        setCountValue(node,newValue);
      }    
      function updateSliderFromCountValue(node)
      {
        var newValue=(node.visInstances/node.nInstances)*100;
        setSliderValue(node,newValue);
        //console.log(node);
      }
  
      function setCountValue(node,newValue)
      {
        node.visInstances=Math.floor(newValue);
        if(node.visInstances>node.nInstances)
          node.visInstances=node.nInstances;
      }
      function unlockedParents(node) { 
        if(node.isroot!==true)
        {
            unlockedNode(node);
            unlockedParents(node.parent);
        }
    }
      function lockedChildren(node) { 
          if(node.children!==null)
          {
            node.children.forEach((item) => {
              
              if(item.isEmpty==false)
              {
                if(item.children!=null)
                {
                  lockedChildren(item);
                }
                //computeMinMaxRange(item);
                lockedNode(item);
              }
            });
            
          }
      }
      function getColor(node)
      {
        return node.elem.children[3].children[0];
      }
      function getLockElement(node) {
        //console.log(node);
        return node.elem.children[4].children[0];
    }
    function updateParentsSliderCountValues(node) {
      if(node.isroot===false)
      {
        var sum=0;
        node.children.forEach((item) => {
          sum=sum + item.visInstances;
        });
        if(node.children[0].isPropClassName==true)
          {
            sum=sum/node.children.length;
          }
        setCountValue(node,sum);
        updateSliderFromCountValue(node);
        updateParentsSliderCountValues(node.parent);
      }
      
    }
    function increaseChildrenSliderCountValues(node,changeValue)
    {
      if(node.children!==null)
      {
          var parentCount=node.nInstances;
          var avalChild=[];
          node.children.forEach((child) => {
          if(child.visInstances<child.nInstances && child.isDisabled==false)
          {
              avalChild.push(child);
          }
          else
          {
              parentCount-=child.nInstances;
          }
          });
          while(changeValue>0)
          {
            var rem=0;
            var newParentCount=parentCount;
            avalChild.forEach((child) => {
              var ratio=Math.ceil(changeValue *(child.nInstances/parentCount));
              if(child.visInstances+ratio>child.nInstances){
                  var chChangeValue=child.nInstances-child.visInstances;
                  rem+=ratio-chChangeValue;
                  setCountValue(child,child.nInstances);
                  updateSliderFromCountValue(child);
                  increaseChildrenSliderCountValues(child,chChangeValue) ;
                  //delete that child
                  const index = avalChild.indexOf(child);
                  if (index > -1) {
                    avalChild.splice(index, 1);
                  }
                  newParentCount-=child.nInstances;
                }
                else
                {
                  setCountValue(child,child.visInstances+ratio);
                  updateSliderFromCountValue(child);
                  increaseChildrenSliderCountValues(child,ratio) ;
                }
                });
              changeValue=rem;
              parentCount=newParentCount;
              if(avalChild==null)
              {
                break;
              }
               
          }
      }
    }
    function decreaseChildrenSliderCountValues(node,changeValue)
    {
      if(node.children!==null)
      {
        var parentCount=node.nInstances;
          var avalChild=[];
          node.children.forEach((child) => {
          if(child.visInstances>0 && child.isDisabled==false)
          {
              avalChild.push(child);
          }
          else
          {
              parentCount-=child.nInstances;
          }
          });
          while(changeValue>0)
          {
            var rem=0;
            var newParentCount=parentCount;
            avalChild.forEach((child) => {
              var ratio=Math.ceil(changeValue *(child.nInstances/parentCount));
              //console.log(ratio);
              if(child.visInstances-ratio<0){
                  var chChangeValue=child.visInstances;
                  rem+=ratio-chChangeValue;
                  setCountValue(child,0);
                  updateSliderFromCountValue(child);
                  decreaseChildrenSliderCountValues(child,chChangeValue) ;
                  //delete that child
                  const index = avalChild.indexOf(child);
                  if (index > -1) {
                    avalChild.splice(index, 1);
                  }
                  newParentCount-=child.nInstances;
                  
                }
                else
                {
                  rem-=ratio;
                  setCountValue(child,(child.visInstances-ratio));
                  updateSliderFromCountValue(child);
                  decreaseChildrenSliderCountValues(child,ratio) ;
                }
                });
                changeValue=rem;
                parentCount=newParentCount;
                if(avalChild==null)
                {
                  break;
                }
          }
          
      }
    }
        function updateChildrenColorValue(node,colorValue)
        {
              if(node.children!==null)
              {
                node.children.forEach((item) => {
                  
                  if(item.isDisabled==false)
                  {
                    setColorValue(item,colorValue);
                    updateChildrenColorValue(item,colorValue);
                  }
                });
              }
        }
             /**
       * Return slider value
       * @param {Object} obj
       * @return {Object}
       */ 
      function getSlider(obj) {
      //  console.log(obj);
        return (obj.elem.children[2].children[0]);
      }
      function getSliderCurrentValue(obj) {
    
        return parseInt(getSlider(obj).value);
      }
      function setColorValue(obj,newValue)
      {
        getColor(obj).value = newValue;
        obj.color=newValue;
      }
                 /**
       * set slider value
       * @param {Object} obj
       */ 
      function setSliderValue(node,newValue) {
        //$(obj.sliderObj).bootstrapSlider('setValue',newValue);
        //getSlider(obj).value = newValue;
        
        node.sliderObj.object.setValue(newValue);
        node.sliderValue=newValue;
        updateSliderTracks(node);
      }
                 /**
       * Return slider max value
       * @param {Object} obj
       * @return {number}
       */ 
      function getSliderMaxValue(obj) {
        return parseInt(getSlider(obj).max);
      }
             /**
       * Return value
       * @param {Object} obj
       * @return {number}
       */ 
      function getSumOfChildValues(obj) {
        var sum=0;
        obj.children.forEach((item) => {
          sum=sum + item.maxSliderValue;
        });
        return sum;
      }
      /**
       * Return object length
       * @param {Object} obj
       * @return {number}
       */
      function getLength(obj) {
        let length = 0;
        for (let property in obj) {
          length += 1;
        };
        return length;
      }
      
      
      /**
       * Return variable storageType
       * @param {*} val
       */
      function getType(val) {
        let storageType = typeof val;
        if (Array.isArray(val)) {
          storageType = 'array';
        } else if (val === null) {
          storageType = 'null';
        }
        return storageType;
      }
      
      
      /**
       * Recursively traverse json object
       * @param {Object} obj parsed json object
       * @param {Object} parent of object tree
       */
      function traverseObject(obj, parent) {
        for (let property in obj) {
          const child = createNode();
          //child.isPropertyTree=isPropertyTree;
          child.parent = parent;
          child.storageType = getType(obj[property]);
          if(Array.isArray(obj))
          {
            child.property = obj[property];
          }
          else{
            child.property = property;
          }
          if(child.parent.isPropClassName!==true)
          {
             child.isPropClassName=true;
          }
          child.depth = parent.depth + 1;
          child.expanded = false;
          child.isroot=false
          if (typeof obj[property] === 'object') {
            child.children = [];
            parent.children.push(child);
            traverseObject(obj[property], child);
            /*
              child.maxSliderValue = //  should be computed from element list
            }*/
            child.elem = createExpandedElement(child);
          } else {
            
            //child.maxSliderValue = //  should be computed from element list
            child.elem = createNotExpandedElement(child);
            parent.children.push(child);
          }
        }
      }
      function getPropertyLowValue(property,hi)
      {
        var p=propertyJsonList.find(x => x.property == property && x.hi == hi );

        return p.lo;

      }
      /*function getCountElementArr(properities)
      {
  
      }*/
      /*function getValueFromPropArr(node,_type)
      {
        var _name=node.parent.property;
        for (var i=0 ; i < propertyVList.length ; i++)
        {
            if (propertyVList[i].name == _name) {
             
                for (var j=0 ; j < propertyVList[i].types.length ; j++)
                {
                  //console.log(propertyVList[i].types);
                  if (propertyVList[i].types[j].type == _type) {
                    //console.log(propertyVList[i].types[j].value);
                    return propertyVList[i].types[j].value;
                  }
                }
            }
        }
       
      }*/
      /**
       * Create root of a tree
       * @param {Object} obj Json object
       * @return {Object}
       */
      function createTree(obj) {
        const tree = createNode();
        tree.storageType = getType(obj);
        //tree.isPropertyTree=isPropertyTree;
        tree.sliderValue = 100;
        //tree.nInstances = nbElement;
        tree.children = [];
        tree.expanded = true;
        tree.isroot=true;
        tree.isPropClassName=false;
        traverseObject(obj, tree);
        
        tree.elem = createExpandedElement(tree);
        return tree;
      } 
      /**
       * Recursively traverse Tree object
       * @param {Object} node
       * @param {Callback} callback
       */
      function traverseTree(node, callback) {
        callback(node);
       // node.sliderObj=$('.slider').last().bootstrapSlider({
        //  rangeHighlights: [{ "start": 0, "end": node.occludedInstance, "class": "occluded" },
        //                    { "start": node.sliderValue, "end": 100, "class": "discarded" }]});//.on('change',sliderHasChanged);
        
        if (node.children !== null) {
          node.children.forEach((item) => {
            
            traverseTree(item, callback);
          });
        }
      }
      /*function sliderHasChanged()
      {
          console.log(this);
      }*/
      /**
       * Render Treeee object
       * @param {Object} tree
       * @param {String} targetElem
       */
      function render(tree, targetElem,i) {
        let rootElem;
        if (targetElem) {
          rootElem = document.querySelectorAll(targetElem);
        } else {
          rootElem = document.body;
        }
      
        traverseTree(tree, (node) => {
          if (!node.expanded) {
            node.hideChildren();
          }
          rootElem[i].appendChild(node.elem);
        });
      }
      
  
     
   /* Export jsonView object */
   window.jsonView = {
    /**
     * Render JSON into DOM container
     * @param {String} jsonData
     * @param {String} targetElem
     */
    format: function(jsonData, targetElem) {
      let parsedData = jsonData;
      if (typeof jsonData === 'string' || jsonData instanceof String) 
          parsedData = JSON.parse(jsonData);
     
      Htree = createTree(parsedData,false);
      render(Htree, targetElem,0);
      Htree.nInstances=nbElement;
      Htree.visInstances=Htree.nInstances;
      
      findHiLoValues(Htree);
      countElementsOfthisClass(Htree,[],[]); 
    }
  }
  function findHiLoValues(node)
  {
    if(node.isPropClassName!=true&&node.isroot!=true){
      node.hi=node.property;
      node.lo=getPropertyLowValue(node.parent.property,node.property);

    }
    if(node.children!=null)
    {
      node.children.forEach((child) => {
        findHiLoValues(child);
      });
    }
  }
  function countElementsOfthisClass(node,className,problist)
  {
   if(node.isPropClassName==true){
         
          className.push(node.property);
          node.nInstances=countElements(className,problist);
          node.visInstances=node.nInstances;
          if(node.nInstances==0)
          {
            LockedEmptyNode(node);
          }
          node.children.forEach((item) => {
            countElementsOfthisClass(item,className,problist);
          });
          className.pop();
    }
    else if(node.children!=null)
    {
      if(node.property!=null)
      {
        
        problist.push(node.hi);
        problist.push(node.lo);
        node.nInstances=countElements(className,problist);
        node.visInstances=node.nInstances;
        if(node.nInstances==0)
        {
          LockedEmptyNode(node);
        }
      }
      node.children.forEach((item) => {
        countElementsOfthisClass(item,className,problist);
      });
      if(node.property!=null)
      {
        problist.pop();
        problist.pop();
      }

    }
    else {
      
      problist.push(node.hi);
      problist.push(node.lo);
      node.nInstances=countElements(className,problist);
      node.visInstances=node.nInstances;
      if(node.nInstances==0)
      {
        LockedEmptyNode(node);
      }
      problist.pop();
      problist.pop();
    }
  }
  function LockedEmptyNode(node)
  {
      node.isEmpty=true;
      //LockChange
      var element = getLockElement(node);
      element.className='empty';
     // $(node.sliderObj).bootstrapSlider("disable");
     // $(node.sliderObj).bootstrapSlider('setValue', 0);
      node.isDisabled=true;
      node.minSliderValue=0;
      node.maxSliderValue=0;
  }
  function countElements(className,problist)
  {
    var count=0;
    for(var i=0;i<nbElement;i++)
    {
      //var incCount=true;
      var AllPropExist=true;
      var jj=0;
      for(var j=0;j<problist.length-1;j+=2)
      {
        
        var propExist=false;
        for(var k=0;k<ElementArr[i].properties.length;k++)
        {//console.log(className);
          var el_property=ElementArr[i].properties[k].property;
          var el_val=ElementArr[i].properties[k].value;
          if (className[jj]==el_property && el_val < problist[j] && el_val >= problist[j+1] ) {
            propExist=true;
            break;
          }
        }
        if(propExist==false)
        {
          AllPropExist=false;
          break;
        }
        jj++;
      }
      if(AllPropExist==true)
      {
        count++;
      }
    }
    return count;
  }
  /*function connectTrees(HItree,node)
  {
      if (node !== null) {
        searchANDLink(HItree,node,node.property);
        if(node.children!=null)
        {
          node.children.forEach((child) => {
            connectTrees(HItree,child);
          });
        }
  
      }
  }
  function searchANDLink(HInode,node,property)
  {
      
        if (HInode !== null) {
         
            if(HInode.property==property)
            {
              //console.log(Hnode.property);
              HInode.control=node;
              node.HIcontrol.push(HInode);
            }
            else
             {
               if (HInode.children !== null)
               {
                HInode.children.forEach((child) => {
                  searchANDLink(child,node,property);
                });
  
               }
                
            }
        }
    
  }*/
  })();