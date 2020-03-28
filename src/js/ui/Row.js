// #package js/main

// #include UIObject.js

// #include ../../html/ui/Row.html

class Row extends UIObject {

constructor(options) {
    super(TEMPLATES.Row, options);

    Object.assign(this, {
        label      : ''
    }, options);
    this._handleChangeColoredSlider=this._handleChangeColoredSlider.bind(this);
    this._binds.changeColoredSlider.addEventListener('click', this._handleChangeColoredSlider);
    

    //this._binds.input.value = this.label;
}

setEnabled(enabled) {
    super.setEnabled(enabled);
    this._binds.input.disabled = !enabled;

}
_handleChangeColoredSlider = function() {
    //set defaults
    
new Dragdealer('pr-slider', {
    animationCallback: function(x, y) {
        console.log(this);
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
