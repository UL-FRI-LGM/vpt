// #package js/main

// #include AbstractDialog.js

// #include ../../uispecs/RuleListDialog.json

class RuleListDialog extends AbstractDialog {

constructor(options) {
    super(UISPECS.RuleListDialog, options);
    //console.log(propertyList);
    //console.log(propertyArr);
    this._handleChangeColoredSlider=this._handleChangeColoredSlider.bind(this);
    this._binds.changeColoredSlider.addEventListener('click', this._handleChangeColoredSlider);
    $("#third-highlight").css("width",""+(100-(0))+"%");
    $("#third-highlight").css("left",""+(0)+"%");
    $("#third-highlight").show();
    /*this._handleCreateHierarchyJSONFile=this._handleCreateHierarchyJSONFile.bind(this);
    this._binds.createHierarchyJSONFile.addEventListener('click', this._handleCreateHierarchyJSONFile);
    
    this._handleReadJSONButton=this._handleReadJSONButton.bind(this);
    this._binds.ReadJSONButton.addEventListener('click', this._handleReadJSONButton);*/

    /*fetch("data_schema.json").then(response => response.json()).then(data_schema=>{
      var json =data_schema['stats']['global'];
      nbProperty=0;
      for (var x in json) {
          let p=new Property(x,nbProperty);  
          var d={text: "",id:"", expanded: true,iconCls: "fa fa-folder"};
          d.text=x;
          d.id=nbProperty;
          nbProperty++;
          propertyList.push(d);
   
          for (var y in json[x]) {
              let pp=new PropValue(y,json[x][y])
              p.types.push(pp);
          }
          propertyArr.push(p);
      }
      //console.log(propertyArr);
   });
   fetch("data_schema.json").then(response => response.json()).then(data_schema=>{
      var json =data_schema['stats']['elements'];
      nbElement=0;
      for (var x in json) {
          let e=new Element(nbElement);  
          nbElement++;
          for (var y in json[x]) {
              let pp=new PropValue(y,json[x][y])
              e.properties.push(pp);
          }
          ElementArr.push(e);
      }
      //console.log(ElementArr);
   });*/
}
_handleChangeColoredSlider = function() {
    		//set defaults
		new Dragdealer('pr-slider', {
            animationCallback: function(x, y) {
              var slider_value = ((Math.round(x * 100)));
              $("#pr-slider .value").text('');
              //$("#pr-slider .value").text(slider_value);
              var start;
              var min=30;
              //var max=50;	
              $("#third-highlight").show();
              if(slider_value >= 0 && slider_value <= min){
                  start=0;
                  $("#second-highlight").hide();
                  $("#first-highlight").show();
                  $("#first-highlight").css("width",""+(slider_value)+"%");
                  $("#first-highlight").css("left",""+(start)+"%");
                
              }
              
             if(slider_value > min ){//&& slider_value <= max){
                  start=(min-1);
                  $("#first-highlight").css("width",""+(start)+"%");
                  $("#second-highlight").show();
                  //$("#third-highlight").hide();
                  $("#second-highlight").css("width",""+((slider_value)-start)+"%");
                  $("#second-highlight").css("left",""+(start)+"%");
              }
              $("#third-highlight").css("width",""+(100-(slider_value))+"%");
              $("#third-highlight").css("left",""+(slider_value)+"%");
            }
            });
    
  }
}