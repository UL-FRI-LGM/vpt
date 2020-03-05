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
     * @param {String} type html element 
     * @param {Object} config
     */
    function  createElement(type, config) {
      const htmlElement = document.createElement(type);
    
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
        content: node.key,
      });
    
      const typeElem = createElement('div', {
        className: 'json-type',
        content: "Scene",
      });
    
      const keyElem = createElement('div', {
        className: 'json-key',
        content: node.key,
      });
      node.value = getSumOfChildValues(node);

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
      if (node.key === null) {
        lineChildren = [caretElem,typeElem,div_slider,div_Lock]
      } else if (node.parent.type === 'array') {
        lineChildren = [caretElem,indexElem,div_slider,div_Lock]
      } else {
        lineChildren = [caretElem,keyElem,div_slider,div_Lock]
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
    
      const keyElem = createElement('div', {
        className: 'json-key',
        content: node.key
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
      const lineElem = createElement('div', {
        className: 'line',
        children: [caretElem, keyElem,div_slider,div_Lock]
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
        key: null,
        parent: null,
        value: null,
        expanded: false,
        type: null,
        children: null,
        elem: null,
        depth: 0,
    
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
            var maxValue = getSliderCurrentValue(this);
            var currValue= getSliderCurrentValue(this);
            updateParentsSliderValue(this.parent);
            if(this.children!==null)
            {
              var preValue=0;
              this.children.forEach((item) => {
                preValue=preValue + getSliderCurrentValue(item);
              });
              var diff=currValue-preValue;
              if(diff>0){
                increaseChildrenSliderValue(this,diff,preValue);
              }
              else
              {
                decreaseChildrenSliderValue(this,diff*-1,preValue);
              }
            }
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
        if(node===null)
          return ;
        var sum=0;
        node.children.forEach((item) => {
          sum=sum + getSliderCurrentValue(item);
        });
        setSliderValue(node,sum);
        updateParentsSliderValue(node.parent);
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
     * 
     * @param {Object} obj
     */ 
    function updateParentsSliderValue(node) {
      if(node===null)
        return ;
      var sum=0;
      node.children.forEach((item) => {
        sum=sum + getSliderCurrentValue(item);
      });
      setSliderValue(node,sum);
      updateParentsSliderValue(node.parent);
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
      for (let key in obj) {
        length += 1;
      };
      return length;
    }
    
    
    /**
     * Return variable type
     * @param {*} val
     */
    function getType(val) {
      let type = typeof val;
      if (Array.isArray(val)) {
        type = 'array';
      } else if (val === null) {
        type = 'null';
      }
      return type;
    }
    
    
    /**
     * Recursively traverse json object
     * @param {Object} obj parsed json object
     * @param {Object} parent of object tree
     */
    function traverseObject(obj, parent) {
      for (let key in obj) {
        const child = createNode();
        child.parent = parent;
        child.key = key;
        child.type = getType(obj[key]);
        child.depth = parent.depth + 1;
        child.expanded = false;
    
        if (typeof obj[key] === 'object') {
          child.children = [];
          parent.children.push(child);
          traverseObject(obj[key], child);
          child.elem = createExpandedElement(child);
        } else {
          child.value = obj[key];
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
    function createTree(obj,numParticles) {
      const tree = createNode();
      tree.type = getType(obj);
      tree.value = numParticles;
      tree.children = [];
      tree.expanded = true;
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
        
        const tree = createTree(parsedData['stats']['elements'],numParticles);
        render(tree, targetElem,0);

        const tree2 = createTree(parsedData['stats']['global'],numParticles);
        render(tree2, targetElem,1);
      }
    }
    })();
    