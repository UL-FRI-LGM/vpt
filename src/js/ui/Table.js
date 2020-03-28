// #package js/main

// #include UIObject.js

// #include ../../html/ui/Table.html
var rulesTable= null;
class Table extends UIObject {

constructor(options) {
    super(TEMPLATES.Table, options);

    Object.assign(this, {
        label      : '',
        //rulesTable : null
    }, options);
    
    this._handleAddButton=this._handleAddButton.bind(this);
    this._binds.AddMore.addEventListener('click', this._handleAddButton);
    rulesTable=createTable();

    //this._binds.input.value = this.label;
}

setEnabled(enabled) {
    super.setEnabled(enabled);
    this._binds.input.disabled = !enabled;

}

_handleAddButton = function() {
    if(rulesTable.length==0)
    {
      rulesTable.elem = document.querySelector(".rulesTable");
    }
    
    var newRow=createRow();
    fillRowWithInfo(newRow);
    //fill the row with info
    newRow.elem = createNewRowElement(newRow);
    newRow.rowNumber=rulesTable.length;
    rulesTable.length=rulesTable.length+1;
    rulesTable.elem.appendChild(newRow.elem);
    rulesTable.children.push(newRow);
    

    console.log(newRow);
    //console.log(jQuery('#.instantiate row').clone();
    //$(".firstRow").hide();
    //console.log('hii');
}

}

/*$(function(){
    $('#addMore').on('click', function() {
        
     });
     $(document).on('click', '.remove', function() {
         var trIndex = $(this).closest("tr").index();
            //if(trIndex>0) {
             $(this).closest("tr").remove();
           /*} else {
             alert("Sorry!!");
           }
      });

}); 
//$("#pr-slider").ready(SliderHandler); 
$("#tb").on("click", "#up", Up); 
$("#tb").on("click", "#down", Down); 

}*/

function createTable()
{
    return {
        length:0,
        elem:null,
        children:[],
    }

}
  
function createNewRowElement(row) {
    //-----------------------------------
    const removeDiv= createElement('span', { 
      });
      removeDiv.innerHTML='&#8722;';
      removeDiv.setAttribute('id','remove');
      const tdRemove = createElement('td', {
        className: 'control',
        children: [removeDiv]
      });
    const handleRemove = row.removeThis.bind(row);
    removeDiv.addEventListener('click', handleRemove);
    //-----------------------------------
    const selectProperty = createElement('select',{
      className: 'selectProperty',
    });  
    selectProperty.setAttribute('data-bind','input');
    var OptionProperty = createElement('option');
   // OptionProperty.setAttribute('disabled','');
    OptionProperty.setAttribute('selected','');
   // OptionProperty.setAttribute('hidden','');
    OptionProperty.setAttribute('value','All');
    OptionProperty.innerHTML='All';
    selectProperty.appendChild(OptionProperty);
    //console.log(propertyList[0]['text']);
    for( var i=0;i<propertyList.length;i++)
    {
       var OptionProperty = createElement('option');
       OptionProperty.setAttribute('value',propertyList[i]['text']);
       OptionProperty.innerHTML=propertyList[i]['text'];
       selectProperty.appendChild(OptionProperty);
    }

    //propertyList
    //

    const handlePropertyChange = row.propertyChange.bind(row);
    selectProperty.addEventListener('change', handlePropertyChange);

    //Addlisener change???
    const divDropdown = createElement('div', {
        className: 'instantiate dropdown',
        children: [selectProperty]
      });  
     
    const divDropdownCont = createElement('div', {
        className: 'container',
        children: [divDropdown]
      });
    divDropdownCont.setAttribute('data-bind','container');

    const labelProperty = createElement('label',{
      content: 'Property:',
    });
    labelProperty.setAttribute('data-bind','label');
  
    const PropertyField = createElement('div', {
        className: 'instantiate field',
        children: [labelProperty,divDropdownCont]
      });  
      //-----------------------------------
      const OptionProValue = createElement('option',{
      });
      //OptionProValue.setAttribute('disabled','');
      OptionProValue.setAttribute('selected','');
      //OptionProValue.setAttribute('hidden','');
      OptionProValue.setAttribute('value','All');
      OptionProValue.innerHTML='All';
  
      const selectProValue = createElement('select',{
          className: 'selectProperty',
          children: [OptionProValue]
        });  
        selectProValue.setAttribute('data-bind','input');
        const handlePropValueChange = row.propValueChange.bind(row);
        selectProValue.addEventListener('change', handlePropValueChange);

       // selectProValue.setAttribute('multiple','');
      //Addlisener change???
      const div2Dropdown = createElement('div', {
          className: 'instantiate dropdown',
          children: [selectProValue]
        });  
  
      const div2DropdownCont = createElement('div', {
          className: 'container',
          children: [div2Dropdown]
        });
        div2DropdownCont.setAttribute('data-bind','container');
      const labelValue = createElement('label',{
        content: 'Value:',
      });
      labelValue.setAttribute('data-bind','label');
    
      const ValueField = createElement('div', {
          className: 'instantiate field',
          children: [labelValue,div2DropdownCont]
        }); 
        ValueField.setAttribute('id','value');
     //-----------------------------------
     const theSlider = createElement('input', {
      className: 'theSlider'
    });  
    const handleSliderChange = row.sliderChange.bind(row);
    theSlider.addEventListener('change', handleSliderChange);

      theSlider.setAttribute('id',"range");
      theSlider.setAttribute('type',"range");
      theSlider.setAttribute('max',100);
      theSlider.setAttribute('min',0);
      theSlider.setAttribute('value',100);
      theSlider.setAttribute('step',1);
      const divSlider = createElement('div', {
        className: 'listSlider',
        children: [theSlider]
      });  
     const labelVis = createElement('label',{
      content: 'Visibility:',
    });
     labelVis.setAttribute('data-bind','label');
    
      const VisField = createElement('div', {
          className: 'instantiate field',
          children: [labelVis,divSlider]
        }); 
        VisField.setAttribute('id','visValue');
     //-----------------------------------
     const theColor = createElement('input', {
    });  
      theColor.setAttribute('data-bind',"input");
      theColor.setAttribute('type',"color");
      theColor.setAttribute('style','border: 0ch;');
      const handleColorChange = row.ColorChange.bind(row);
      theColor.addEventListener('change', handleColorChange);

      const divSColor = createElement('div', {
        className: 'container',
        children: [theColor]
      });  
      divSColor.setAttribute('data-bind',"container");
     const labelColor = createElement('label',{
      content: 'Color:',
    });
    labelColor.setAttribute('data-bind','label');
    
      const ColorField = createElement('div', {
          className: 'instantiate field',
          children: [labelColor,divSColor]
        }); 
        ColorField.setAttribute('id','colorValue');
     //-----------------------------------
    const tdProperty = createElement('td', {
        children: [PropertyField,ValueField,VisField,ColorField]
      });
      tdProperty.setAttribute('rowspan','4');
      tdProperty.setAttribute('id','notControl');
      const rowElem1 = createElement('tr', {
        children: [tdRemove,tdProperty]
      });
      //----------------------------------- 
      const spanUp= createElement('span',{
      });
      spanUp.innerHTML='&#9650;';
      spanUp.setAttribute('id','up');
      const handleClickUp = row.clickUp.bind(row);
      spanUp.addEventListener('click', handleClickUp);
  
      const tdUp = createElement('td', {
        children: [spanUp]
      });
      tdUp.setAttribute('id','control');
      
      const rowElem2 = createElement('tr', {
        children: [tdUp]
      });
      //----------------------------------- 
      const spanDown= createElement('span',{
      });
      spanDown.setAttribute('id','down');
      spanDown.innerHTML='&#9660;';

      const handleClickDown = row.clickDown.bind(row);
      spanDown.addEventListener('click', handleClickDown);
      const tdDown = createElement('td', {
        children: [spanDown]
      });
      tdDown.setAttribute('id','control');
      const rowElem3 = createElement('tr', {
        children: [tdDown]
      });
      //-----------------------------------
      const spanEmpty= createElement('span',{
      });
    
      spanEmpty.innerHTML='&nbsp;';
      const tdEmpty = createElement('td', {
        children: [spanEmpty]
      });
      tdEmpty.setAttribute('id','control');

      const rowElem4 = createElement('tr', {
        children: [tdEmpty]
      });
      //-----------------------------------
      const rowElemF = createElement('div', {
        children: [rowElem1,rowElem2,rowElem3,rowElem4]
      });
      rowElemF.setAttribute('id','hline');
    return rowElemF;
  }
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
     * create tree node
     * @return {Object}
     */
    function createRow() {
        return {
          property: null,
          propertyValue: null,
          count: 0,
          visCount: 0,
          sliderValue: 100,
          color:'#808080',//gray
          elem: null,
          rowNumber:0,
          propertyChange:function()
          {
            var selectValueElem=getValueDropboxElem(this);
            var selectPropElem=getPropDropboxElem(this);
            selectValueElem.options.length=0;
            var isFound=false;
            propertyArr.forEach((prop) => {
              if (selectPropElem.value==prop['name'])
              {
                  isFound=true;
                  this.property=prop['name'];
                  this.count=prop['value'];
                  this.visCount=prop['value'];//read from slider

                  var OptionProperty = createElement('option');
                  OptionProperty.setAttribute('value','All');
                  OptionProperty.innerHTML='All';
                  selectValueElem.appendChild(OptionProperty);
                  prop['types'].forEach((value) => {
                  OptionProperty = createElement('option');
                  OptionProperty.setAttribute('value',value['type']);
                  OptionProperty.innerHTML=value['type'];
                  selectValueElem.appendChild(OptionProperty);
                });
              }
            });
            if(isFound==false)
            {
                  var OptionProperty = createElement('option');
                  OptionProperty.setAttribute('value','All');
                  OptionProperty.innerHTML='All';
                  selectValueElem.appendChild(OptionProperty);

                  this.property='All';
                  this.propertyValue='All';
                  this.count=nbElement;
                  this.visCount=row.count;//read from slider
            }
          },
          propValueChange: function()
          {
            var selectValueElem=getValueDropboxElem(this);
            var selectPropElem=getPropDropboxElem(this);
            if (selectValueElem.value=='All')
              {
                this.propertyValue='All';
                propertyArr.forEach((prop) => {
                  if (selectPropElem.value==prop['name'])
                  {
                      this.count=prop['value'];
                      this.visCount=prop['value'];//read from slider

                  }
                  });
              }
              else
              {
                
                propertyArr.forEach((prop) => {
                  if (selectPropElem.value==prop['name'])
                  {
                      this.property=prop['name'];
                      this.propertyValue=selectValueElem.value;
                      prop['types'].forEach((p) => {
                        if(p['type']==selectValueElem.value)
                        {
                          this.count=p['value'];
                          this.visCount=p['value'];//read from slider
                        }
                      });
                  }
                });
              }
              console.log(this);
          },
          clickUp: function(){
           
            var prevIndex=this.rowNumber-1;
            if(prevIndex<0) {
              alert("Sorry!!");
            }
            else{
              var prevElement=rulesTable.children[prevIndex].elem;
              prevElement.before(this.elem);
              swapRowInTableArray(rulesTable.children[prevIndex],this);
            }
            

          },
          clickDown: function(){
            var successIndex=this.rowNumber+1;
            if(successIndex>=rulesTable.length) {
              alert("Sorry!!");
            }
            else{
              var successElement=rulesTable.children[successIndex].elem;
              this.elem.before(successElement);
              swapRowInTableArray(rulesTable.children[successIndex],this);
            }
          },
          sliderChange: function() {
                console.log('Slider');

        //console.log('propertyArr');
        //console.log(propertyArr);
        /*property: null,
          propertyValue: null,
          count: 0,
          visCount: 0,
        propertyArr.forEach((prop) => {});*/

          },
          removeThis:function()
          {
            var row=getRowElem(this);
            row.remove();
            const index = rulesTable.children.indexOf(this);
            if (index > -1) {
              rulesTable.children.splice(index, 1);
            }
            rulesTable.length=rulesTable.length-1;
          },
          ColorChange:function()
          {
            
              this.color=(getColorElem(this)).value;
          }
        }
      }
      function getColorElem(row)
      {
        return row.elem.children[0].children[1].children[3].children[1].children[0];
      }
      function getRowElem(row)
      {
        return row.elem;//node.elem.children[3].children[0];
      }
      function getValueDropboxElem(row)
      {
        return row.elem.children[0].children[1].children[1].children[1].children[0].children[0];//node.elem.children[3].children[0];
      }
      function getPropDropboxElem(row)
      {
        return row.elem.children[0].children[1].children[0].children[1].children[0].children[0];//node.elem.children[3].children[0];
      }
      function getUpButton(row)
      {
        return row.elem.children[0];
      }
      function  fillRowWithInfo(row)
      {
        row.property='All';
        row.propertyValue='All';
        row.count=nbElement;
        row.visCount=row.count;
      }
      function swapRowInTableArray(row1, row2) {
        var temp = rulesTable.children[row1.rowNumber];
        rulesTable.children[row1.rowNumber] = rulesTable.children[row2.rowNumber];
        rulesTable.children[row2.rowNumber] = temp; 
        // swap numbers
        var tempIndex=row1.rowNumber;
        row1.rowNumber=row2.rowNumber;
        row2.rowNumber=tempIndex;
        }