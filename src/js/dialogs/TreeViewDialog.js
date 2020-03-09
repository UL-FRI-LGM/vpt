// #package js/main

// #include AbstractDialog.js

// #include ../../uispecs/TreeViewDialog.json

class TreeViewDialog extends AbstractDialog {

constructor(options) {
    super(UISPECS.TreeViewDialog, options);
    this._handleCreateTreeButton=this._handleCreateTreeButton.bind(this);
    this._binds.createTreeButton.addEventListener('click', this._handleCreateTreeButton);
}

_handleCreateTreeButton = function() {
  
   fetch('data_schema.json')
    .then((res)=> { return res.text();})
    .then((data) => { 
      jsonView.format(data, '.root'); })
    .catch((err) => {  console.log(err); })
}
}
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
    
      const indexElem = createElement('div', {
        className: 'json-index',
        content: node.property,
      });
    
      const typeElem = createElement('div', {
        className: 'json-type',
        content: 'Global',
      });
    
      const propertyElem = createElement('div', {
        className: 'json-property',
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
      const div_slider=createElement('div', {
        className: 'treeSlider'
      });
      const div3 =createElement('input', {
        className: 'theSlider'
      });
      const handleChange = node.sliderChange.bind(node);
      div3.addEventListener('click', handleChange);
      div3.setAttribute('type',"range");
      div3.setAttribute('max',node.value);
      div3.setAttribute('min',0);
      div3.setAttribute('value',node.value);
      div3.setAttribute('step',1);
      div_slider.appendChild(div3);

      let lineChildren;
      if( node.isroot==true)
      {
        lineChildren = [caretElem,typeElem]
      }
      else if(node.isPropertyTree)
      {
        if (node.property === null) {
          lineChildren = [caretElem,typeElem,div_slider]
        } else if (node.parent.storageType === 'array') {
          lineChildren = [caretElem,indexElem];//,div_slider]
        } else {
          lineChildren = [caretElem,propertyElem];//,div_slider]
        }
      }
      else if (node.property === null) {
        lineChildren = [caretElem,typeElem];//,div_slider,div_Lock]
      } else if (node.depth == 1) {//else if (node.parent.storageType === 'array') {
        lineChildren = [caretElem,indexElem,div_slider];//,div_Lock]
      } else {
        lineChildren = [caretElem,propertyElem];//,div_slider,div_Lock]
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
    
    /**
     * @param {Object} node
     * @return {HTMLElement}
     */
    function createNotExpandedElement(node) {
      const caretElem = createElement('div', {
        className: 'empty-icon',
      });
    
      const propertyElem = createElement('div', {
        className: 'json-property',
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
      const div_slider =createElement('div', {
        className: 'treeSlider'
      });
      const div3 =createElement('input', {
        className: 'theSlider'
      });
      const handleChange = node.sliderChange.bind(node);
      div3.addEventListener('click', handleChange);
      div3.setAttribute('type',"range");
      div3.setAttribute('max',node.value);
      div3.setAttribute('min',0);
      div3.setAttribute('value',node.value);
      div3.setAttribute('step',1);
      div_slider.appendChild(div3);
      var arr;
      if(node.isPropertyTree)
      {
        arr=[caretElem, propertyElem,div_slider];
      }
     else{
        arr=[caretElem, propertyElem,div_slider,div_Lock];
     }
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
        parent: null,
        value: null,
        maxValue: null,
        expanded: false,
        storageType: null,
        children: null,
        elem: null,
        depth: 0,
        control:null,
        HIcontrol:[],
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
          var el=getSlider(this);
          if(el.disabled!==true)
          {
            var prevValue=this.value;
            var currValue=getSliderCurrentValue(this);
            this.value = currValue;
            var ratio= (this.value/this.maxValue)*100;
            if(this.isPropertyTree && this.HIcontrol!=[])
            {
              this.HIcontrol.forEach((item) => {
                if(isUnLocked(item)===true)
                {
                  var newValue=Math.floor(ratio*(item.maxValue/100));
                  setSliderValue(item,newValue);
                }
              });
            }
            else if(this.control!=null)
            {
              var sum=0;
              //console.log(this);
              //console.log(this.conrol.HIcontrol);
              
              this.control.HIcontrol.forEach((item) => {
                sum=sum+item.value;
              });
              setSliderValue(this.conrol,sum);
            }

            //updateParentsSliderValue(this.parent);

            /*if(this.children!==null)
            {
              var diff=currValue-prevValue;
              if(diff>0){
                increaseChildrenSliderValue(this,diff,preValue);
              }
              else
              {
                decreaseChildrenSliderValue(this,diff*-1,preValue);
              }
            }*/
          }
        },
        LockChange:function(){
          
          if(isUnLocked(this))
          {
            var element = getLockElement(this);
            element.className='lock';
            var element2 = getSlider(this);
            element2.disabled=true;
            lockedChildren(this);
          }
          else
          {
            var element = getLockElement(this);
            element.className='lock unlocked';
            var element2 = getSlider(this);
            element2.disabled=false;
            unlockedParents(this.parent);
            
          }
        }
      }
    }
    function unlockedParents(node) { 
      if(node!==null)
      {
          var element = getLockElement(node);
          element.className='lock unlocked';
          var element2 = getSlider(node);
          element2.disabled=false;
          unlockedParents(node.parent);
      }
  }
  function isUnLocked(node) { 
    var element = getLockElement(node);
    if(element.className==='lock unlocked')
        return true;
    else
        return false;
  }
    function lockedChildren(node) { 
        if(node.children!==null)
        {
          node.children.forEach((item) => {
            var element = getLockElement(item);
            element.className='lock';
            var element2 = getSlider(item);
            element2.disabled=true;
            lockedChildren(item);
          });
        }
    }
    function getLockElement(node) {
      return node.elem.children[3].children[0];
  }
      /**
       * 
       * @param {Object} obj
       */ 
      function updateParentsSliderValue(node) {
        if(node.isroot===false)
        {
          var sum=0;
          node.children.forEach((item) => {
            sum=sum + item.value;
          });
          setSliderValue(node,sum);
          updateParentsSliderValue(node.parent);
        }
        
      }
  
      function decreaseChildrenSliderValue(node,counter,preValue) {
        if(node.children!==null)
         {
          while(counter>0)
          {
            var i = Math.floor(Math.random() * node.children.length); 
            var v= getSliderCurrentValue(node.children[i]);
            if (v!==0 )//&& isUnLocked(node.children[i]) )
            {
              setSliderValue(node.children[i],v-1);
              decreaseChildrenSliderValue(node.children[i],1);
              counter=counter-1;
            }

          }
        }
      }
      function increaseChildrenSliderValue(node,counter) {
        if(node.children!==null)
        {
          while(counter>0)
          {
            var i = Math.floor(Math.random() * node.children.length);
            var v= getSliderCurrentValue(node.children[i]);
            if (v!==getSliderMaxValue(node.children[i]) )//&& isUnLocked(node.children[i]))
            {
              setSliderValue(node.children[i],v+1);
              increaseChildrenSliderValue(node.children[i],1);
              counter=counter-1;
            }
          }
        }
      }

  
           /**
     * Return slider value
     * @param {Object} obj
     * @return {Object}
     */ 
    function getSlider(obj) {
      return (obj.elem.children[2].children[0]);
    }
    function getSliderCurrentValue(obj) {
  
      return parseInt(getSlider(obj).value);
    }
               /**
     * set slider value
     * @param {Object} obj
     */ 
    function setSliderValue(obj,newValue) {
      getSlider(obj).value = newValue;
      obj.value=newValue;
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
        sum=sum + item.value;
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
    function traverseObject(obj, parent,isPropertyTree) {
      for (let property in obj) {
        const child = createNode();
        child.isPropertyTree=isPropertyTree;
        child.parent = parent;
        child.property = property;
        child.storageType = getType(obj[property]);
        child.depth = parent.depth + 1;
        child.expanded = false;
        child.isroot=false
        if (typeof obj[property] === 'object') {
          child.children = [];
          parent.children.push(child);
          traverseObject(obj[property], child,isPropertyTree);
          //child.value = obj[property];
          child.value = getSumOfChildValues(child);
          child.maxValue = child.value;
          child.elem = createExpandedElement(child);
        } else {
          child.value = obj[property];
          child.maxValue = child.value;
          child.elem = createNotExpandedElement(child);
          parent.children.push(child);
        }
      }
    }

    /**
     * Create root of a tree
     * @param {Object} obj Json object
     * @return {Object}
     */
    function createTree(obj,numParticles,isPropertyTree) {
      const tree = createNode();
      tree.storageType = getType(obj);
      tree.isPropertyTree=isPropertyTree;
      tree.value = numParticles;
      tree.maxValue = numParticles;
      tree.children = [];
      tree.expanded = true;
      tree.isroot=true;
      traverseObject(obj, tree,isPropertyTree);
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
      if (node.children !== null) {
        node.children.forEach((item) => {
          traverseTree(item, callback);
        });
      }
    }

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
    if (typeof jsonData === 'string' || jsonData instanceof String) parsedData = JSON.parse(jsonData);
    var numParticles=parsedData['general']['particles'];
    
    //const properties=createPropertyArray(parsedData['stats']['global']);
    //console.log(Properties);
 
   
    const tree = createTree(parsedData['stats']['elements'],numParticles,false);
    render(tree, targetElem,0);
    const propertyTree = createTree(parsedData['stats']['global'],numParticles,true);
    render(propertyTree, targetElem,1);
    connectTrees(tree,propertyTree);
    console.log(tree);

  }
}
function connectTrees(HItree,node)
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
  
}
      /**
 * Create root of a tree
 * @param {Object} obj Json object
 *@return {Object}
 
function createPropertyArray(obj) {
  var arrayProperties=[];
  var i = 0;
  for (let p in obj) {
    let property = new Property(p,i++);
    property.types=readPropertyValues(obj[p]);
    //property.value=??
    //property.minValue=??
    arrayProperties.push(property);
  }
  return arrayProperties;

}
function readPropertyValues(obj) {
  var arrayTypes=[];
  for (let type in obj) 
  {
      let pv=new PropertyValue(type,obj[type]);
      arrayTypes.push(pv);
  }
  return arrayTypes;
}*/
})();

/***************

class Property  {
constructor(name,id) {
this.name = name;//string
this.id=id;//int
this.types=[]; //PropertyValue
this.control=null; //html elem
this.HIcontrol=[];//html elem
//this.value=??
//this.maxValue=0;
//this.minValue=0;
}
}
class PropertyValue  {
constructor(name,value) {
this.name = name;//string
this.value=value;//int
}
}
//let user = new User("John");
//user.getName();

class HNode  {
constructor(property,value) {
this.subNode = [];//string
this.property=property;//int
this.elem=[]; //html elem
}
}*/

