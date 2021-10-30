// Copyright OHMEC contributors.
// Licensed under the Apache License, Version 2.0, see LICENSE for details.
// SPDX-License-Identifier: Apache-2.0

let holdThis;

L.Control.TimeLineSlider = L.Control.extend({
  options: {
    position: 'bottomleft',
    timelineDateMin: new Date(1,0,1),
    timelineDateMax: new Date,
    timelineDateStart: new Date(1776,6,4),
    sliderWidth: "750px",
  },

  initialize: function (options) {
    L.setOptions(this, options);
  },

  onAdd: function() {
    this.sheet = document.createElement('style');
    document.body.appendChild(this.sheet);

    this.sliderContainer = L.DomUtil.create('div', 'slider_container');

    // Prevent click events propagation to map
    L.DomEvent.disableClickPropagation(this.sliderContainer);

    // Prevent right click event propagation to map
    L.DomEvent.on(this.sliderContainer, 'slider_container', function (ev) {
      L.DomEvent.stopPropagation(ev);
    });

    // Prevent scroll events propagation to map when cursor on the div
    L.DomEvent.disableScrollPropagation(this.sliderContainer);

    // Create html elements for range input, min/max labels, advance button and step buttons
    this.sliderDiv = L.DomUtil.create('div', 'range', this.sliderContainer);
    this.sliderDiv.innerHTML =
      '<input id="rangeinputslide" type="range" min="' +
      this.options.timelineDateMin.getTime() +
      '" max="' +
      this.options.timelineDateMax.getTime() +
      '" step="any" value="' +
      this.options.timelineDateMin.getTime() +
      '"></input>';
    this.rangeObject = L.DomUtil.get(this.sliderDiv).children[0];

    this.sliderYears = L.DomUtil.create('ul', 'slider-years', this.sliderContainer);
    this.sliderYears.innerHTML = "<li>" + this.options.timelineDateMin.getFullYear() + "</li><li>" + this.options.timelineDateMax.getFullYear() + "</li>";


    this.advanceDiv = L.DomUtil.create('div', 'advance', this.sliderContainer);
    this.advanceDiv.innerHTML = '<input type="button" id="advButton" value="Advance"></input>';
    this.advButtonObject = L.DomUtil.get(this.advanceDiv).children[0];

    this.stepFDiv = L.DomUtil.create('div', 'stepF', this.sliderContainer);
    this.stepFDiv.innerHTML = '<input type="button" id="stepFButton" value="Step +"></input>';
    this.stepFButtonObject = L.DomUtil.get(this.stepFDiv).children[0];

    this.stepRDiv = L.DomUtil.create('div', 'stepR', this.sliderContainer);
    this.stepRDiv.innerHTML = '<input type="button" id="stepRButton" value="Step -"></input>';
    this.stepRButtonObject = L.DomUtil.get(this.stepRDiv).children[0];

    holdThis = this;

    this.sheet.textContent = this.setupStartStyles();

    // When time slider gets changed, trigger updateTime function
    L.DomEvent.on(holdThis.rangeObject, "input", function() {
      holdThis.options.updateTime({dateValue: holdThis.rangeObject.value});
    });

    // When advance/pause button gets pressed toggle advance/pause,
    // potentially "move time"

    holdThis.advanceTime = function() {
      let incrTime = (holdThis.options.timelineDateMax.getTime() - holdThis.options.timelineDateMin.getTime())/240;
      let newTime = parseFloat(holdThis.rangeObject.value) + parseFloat(incrTime);
      if(newTime >= holdThis.options.timelineDateMax.getTime()) {
        newTime = holdThis.options.timelineDateMax.getTime();
        clearInterval(holdThis.intervalFunc);
        holdThis.advButtonObject.value = "Advance";
      }
      holdThis.rangeObject.value = newTime;
      holdThis.options.updateTime({dateValue: holdThis.rangeObject.value});
    }

    L.DomEvent.on(holdThis.advButtonObject, "click", function() {
      if(holdThis.advButtonObject.value == "Advance") {
        holdThis.advButtonObject.value = "Stop";
        holdThis.intervalFunc = setInterval(holdThis.advanceTime, 250);
      } else {
        holdThis.advButtonObject.value = "Advance";
        clearInterval(holdThis.intervalFunc);
      }
    });

    L.DomEvent.on(holdThis.stepFButtonObject, "click", function() {
      // step time forward once in datesOfInterest array
      let curTime = holdThis.rangeObject.value;
      for (let i=1;i<datesOfInterestSorted.length;i++) {
        if (curTime >= datesOfInterestSorted[i-1].getTime() && curTime < datesOfInterestSorted[i].getTime()) {
          // make sure we haven't stepped beyond the bounds of the slider
          if (datesOfInterestSorted[i].getTime() > holdThis.options.timelineDateMax.getTime()) {
            holdThis.rangeObject.value = holdThis.options.timelineDateMax.getTime();
            holdThis.options.updateTime({dateValue: holdThis.rangeObject.value});
          } else {
            holdThis.rangeObject.value = datesOfInterestSorted[i].getTime();
            holdThis.options.updateTime({dateValue: holdThis.rangeObject.value});
          }
          return;
        }
      }
    });

    L.DomEvent.on(holdThis.stepRButtonObject, "click", function() {
      // step time backward once in datesOfInterest array
      let curTime = holdThis.rangeObject.value;
      for (let i=0;i<datesOfInterestSorted.length-1;i++) {
        if (curTime > datesOfInterestSorted[i].getTime() && curTime <= datesOfInterestSorted[i+1].getTime()) {
          // make sure we haven't stepped beyond the bounds of the slider
          if (datesOfInterestSorted[i].getTime() < holdThis.options.timelineDateMin.getTime()) {
            holdThis.rangeObject.value = holdThis.options.timelineDateMin.getTime();
            holdThis.options.updateTime({dateValue: holdThis.rangeObject.value});
          } else {
            holdThis.rangeObject.value = datesOfInterestSorted[i].getTime();
            holdThis.options.updateTime({dateValue: holdThis.rangeObject.value});
          }
          return;
        }
      }
    });

    // Initialize input change at start
    let inputEvent = new Event('input');
    this.rangeObject.dispatchEvent(inputEvent);
    this.rangeObject.value = holdThis.options.timelineDateStart.getTime();
    holdThis.options.updateTime({dateValue: holdThis.rangeObject.value});

    return this.sliderContainer;
  },

  onRemove: function() {
    // remove control html element
    L.DomUtil.remove(this.sliderContainer);
  },

  setupStartStyles: function() {
    let rangeWidth = (parseFloat(holdThis.options.sliderWidth) - 15) + "px";
    let labelMargin = (parseFloat(holdThis.options.sliderWidth)/2 - 10) + "px";
    let slider_style = `
      .slider_container {
        background-color: rgba(4,112,255,0.7);
        padding: 5px 15px 5px 15px;
        border-radius: 5px;
        border-style: solid;
        border-color: #0470ff;
        border-width: 1px;
        box-shadow: 5px 5px 5px #888;
      }
      .range {
        position: relative;
        left: -6px;
        height: 5px;
        width: ${holdThis.options.sliderWidth};
      }
      .advance {
        position: relative;
        left: -40px;
        height: 30px;
        width: ${holdThis.options.sliderWidth};
      }
      .stepF {
        position: relative;
        left: -40px;
        height: 0px;
        width: ${holdThis.options.sliderWidth};
      }
      .stepR {
        position: relative;
        left: -40px;
        height: 0px;
        width: ${holdThis.options.sliderWidth};
      }
      .range input {
        width: 100%;
        position: absolute;
      }
      .slider-years {
        margin: 10px -${labelMargin};
        padding: 0;
        list-style: none;
        color: #eee;
      }
      .slider-years li {
        width: ${rangeWidth};
        position: relative;
        float: left;
        text-align: center;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
      }
      #advButton,#stepFButton,#stepRButton {
        position: relative;
        width: 80px;
        padding: 4px 0px;
        margin: -10px 0px -20px 0px;
        font-family: "Tahoma";
        font-size: 14px;
        color: #e0e0ff;
        text-decoration: none;
        background-color: #0470ff;
        border: none;
        align-items: center;
        border-radius: 6px;
      }
      #advButton {
        top: -10px;
        left: 50%;
      }
      #stepFButton {
        top: -19px;
        left: 65%;
      }
      #stepRButton {
        top: -19px;
        left: 35%;
      }
    `;
    return slider_style;
  },
});

L.control.timelineSlider = function(options) {
  return new L.Control.TimeLineSlider(options);
}
