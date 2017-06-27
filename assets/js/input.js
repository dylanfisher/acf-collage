(function($){

  function initialize_field( $el ) {

    var $field = $el;
    var $canvas = $field.find('.collage-item-canvas');

    $canvas.addClass('collage-item-canvas--initialized');

    var $collageItems = $field.find('.collage-item');
    var $input = $canvas.find('input');
    var inputData = $input.val();

    if ( isJsonString( inputData ) ) {
      inputData = JSON.parse( inputData );
    } else {
      inputData = {};
    }

    inputData['items'] = inputData['items'] || {};

    var gridUnitSize = getGridUnitSize();
    var canvasWidth = getCanvasWidth();
    var canvasHeight = getCanvasHeight();

    // Initialize
    collageInit();

    $(document).on('click', '.collage-item', function() {
      var $item = $(this);
      var zIndex = parseInt( $item.css('zIndex') ) || 0;
      var zIndexArray = [];

      $collageItems.each(function() {
        var thisZIndex = parseInt( $(this).css('zIndex') ) || 0;
        zIndexArray.push( thisZIndex );
      });

      var largestZIndex = Math.max.apply( null, zIndexArray );

      $item.css({ zIndex: largestZIndex + 1 });

      updateInputValue();
    });

    $(window).resize( $.debounce( 250, resizeEvents ) );

    var windowWidth = $(window).width();

    function resizeEvents() {
      if ( $(window).width() == windowWidth ) return;

      windowWidth = $(window).width();

      gridUnitSize = getGridUnitSize();
      canvasWidth = getCanvasWidth();
      canvasHeight = getCanvasHeight();

      $canvas.resizable('destroy');

      $collageItems.resizable('destroy')
                   .draggable('destroy');

      updateRelativePositions();

      collageInit();
    }

    $collageItems.on('resizestop dragstop', function(e, ui) {
      var $item = $(ui.helper);
      var index = $item.index('.collage-item');

      inputData['items'][index] = inputData['items'][index] || {};

      if ( ui.size ) {
        inputData['items'][index]['columns'] = Math.round( ui.size.width / gridUnitSize );
      }

      if ( ui.position ) {
        inputData['items'][index]['positionLeft'] = ui.position.left / getCanvasWidth() * 100;
        inputData['items'][index]['positionTop'] = ui.position.top / getCanvasHeight() * 100;
        inputData['items'][index]['columnOffset'] = Math.round( ui.position.left / gridUnitSize );
        // console.log("inputData['items'][index]['positionTop']", ui.position.top / getCanvasHeight() * 100);
      }

      updateInputValue();
    });

    function collageInit() {
      var initialCanvasHeight = getCanvasWidth() * ( parseInt( $canvas.attr('data-initial-collage-height') ) / 100 );
      // console.log('initialCanvasHeight', initialCanvasHeight);

      $canvas.css({ height: initialCanvasHeight });

      // Make the entire canvas resizable
      $canvas.resizable({
        minHeight: ( $(window).width() * 0.6 ),
        handles: 's',
        stop: function() {
          // inputData['canvasHeightRatio'] = $canvas.height() / $(window).width() * 100;
          inputData['canvasHeightRatio'] = getCanvasHeight() / getCanvasWidth() * 100;
          // console.log("inputData['canvasHeightRatio']", inputData['canvasHeightRatio']);
          // inputData['canvasHeightRatio'] = getCanvasWidth() / getCanvasHeight() * 100;
          updateAbsolutePositions();
          updateInputValue();
        },
        start: function() {
          updateRelativePositions();
        }
      });

      updateAbsolutePositions(true);

      $collageItems.each(function() {
        var $item = $(this);

        var resizableOptions = {
          grid: [gridUnitSize, 1],
          containment: $canvas,
          aspectRatio: true
        };

        var draggableOptions = {
          grid: [ gridUnitSize, 10 ],
          containment: $canvas,
          zIndex: 100,
          stack: '.collage-item',
          snap: '.collage-item-canvas__column',
          snapMode: 'inner'
        };

        if ( $item.hasClass('collage-item--layout-custom_row') ) {
          resizableOptions['handles'] = 'e, w';
          resizableOptions['aspectRatio'] = false;
        }

        $item.resizable(resizableOptions)
             .draggable(draggableOptions);
      });

      $collageItems.each(function(index) {
        var $item = $(this);
        var initialZIndex = $item.css('zIndex');

        if ( $item.attr('data-first-initialization') == 'true' ) {
          $item.simulate('drag');
        }

        // $item.simulate('drag');

        // Set default values

        inputData['items'][index] = inputData['items'][index] || {};

        inputData['items'][index]['columns'] = (typeof inputData['items'][index]['columns'] !== 'undefined') ? inputData['items'][index]['columns'] : 6;
        inputData['items'][index]['columnOffset'] = (typeof inputData['items'][index]['columnOffset'] !== 'undefined') ? inputData['items'][index]['columnOffset'] : Math.round( $item.position().left / gridUnitSize );
        inputData['items'][index]['zIndex'] = (typeof inputData['items'][index]['zIndex'] !== 'undefined') ? inputData['items'][index]['zIndex'] : $item.css('zIndex');
        inputData['items'][index]['positionLeft'] = (typeof inputData['items'][index]['positionLeft'] !== 'undefined') ? inputData['items'][index]['positionLeft'] : $item.position().left / getCanvasWidth() * 100;
        inputData['items'][index]['positionTop'] = (typeof inputData['items'][index]['positionTop'] !== 'undefined') ? inputData['items'][index]['positionTop'] : $item.position().top / getCanvasHeight() * 100;

        $item.css({ zIndex: initialZIndex });

        updateInputValue();
      });
    }

    function updateAbsolutePositions(firstInit) {
      $collageItems.each(function() {
        var $item = $(this);
        var top;
        var left;
        if ( firstInit ) {
          top = getCanvasHeight() * ( parseInt( $item.attr('data-top') ) / 100 );
          left = getCanvasWidth() * ( parseInt( $item.attr('data-left') ) / 100 );
        } else {
          top = parseInt( $item.css('top') );
          left = parseInt( $item.css('left') );
        }
        var height = $item.outerHeight();

        if ( !isNaN( top ) ) {
          $item.css({ top: top });
        }

        if ( !isNaN( left ) ) {
          $item.css({ left: left });
        }

        if ( !isNaN( height ) ) {
          $item.css({
            height: height,
            paddingBottom: ''
           });
        }
      });
    }

    function updateRelativePositions() {
      $collageItems.each(function() {
        var $item = $(this);
        var top = parseInt( $item.css('top') ) / getCanvasHeight() * 100 + '%';
        var left = parseInt( $item.css('left') ) / getCanvasWidth() * 100 + '%';
        var originalWidthPercentage = parseInt( $item.attr('data-initial-width') );
        var originalHeightPercentage = parseInt( $item.attr('data-initial-height') );
        var heightRatio = originalWidthPercentage / originalHeightPercentage;
        var width = $item.width();
        var height = width / heightRatio;

        $item.css({
          top: top,
          left: left,
          height: height
        });
      });
    }

    function updateZIndexes() {
      for ( var i = 0; i < $collageItems.length; i++ ) {
        var $highestEl;
        var maxz = -Infinity;

        $collageItems.each(function() {
          var z = parseInt( $(this).css('zIndex') );
          if ( maxz < z ) {
            $highestEl = $(this);
            maxz = z;
          }
        });

        $highestEl.css({ zIndex: -$collageItems.length + i });
      }

      $collageItems.each(function(index) {
        var $item = $(this);

        $item.css({ zIndex: Math.abs( $item.css('zIndex') ) });

        inputData['items'][index] = inputData['items'][index] || {};

        inputData['items'][index]['zIndex'] = $item.css('zIndex') || 0;
      });
    }

    function updateInputValue() {
      updateZIndexes();
      // console.log( 'inputData', inputData );
      // console.log( 'JSON.stringify( inputData )', JSON.stringify( inputData ) );
      $input.val( JSON.stringify( inputData ) );
    }

    // Helpers

    function isJsonString(str) {
      try {
        JSON.parse(str);
      } catch (e) {
        return false;
      }
      return true;
    }

    function getRelativeCanvasHeight() {
      var lowest = 0;
      var $lowestElem;

      $collageItems.each(function () {
        var $this = $(this);
        var offset = $this.position().top + $this.height();

        if ( offset > lowest ) {
          $lowestElem = this;
          lowest = offset;
        }
      });

      return lowest;
    }

    function getGridUnitSize() {
      return Math.floor( getCanvasWidth() / 12 );
    }

    function getCanvasWidth() {
      return $canvas.width();
    }

    function getCanvasHeight() {
      return $canvas.height();
    }

  }


  if( typeof acf.add_action !== 'undefined' ) {

    /*
    *  ready append (ACF5)
    *
    *  These are 2 events which are fired during the page load
    *  ready = on page load similar to $(document).ready()
    *  append = on new DOM elements appended via repeater field
    *
    *  @type  event
    *  @date  20/07/13
    *
    *  @param  $el (jQuery selection) the jQuery element which contains the ACF fields
    *  @return  n/a
    */

    acf.add_action('ready append', function( $el ){

      // search $el for fields of type 'collage'
      acf.get_fields({ type : 'collage'}, $el).each(function(){

        initialize_field( $(this) );

      });

    });


  } else {


    /*
    *  acf/setup_fields (ACF4)
    *
    *  This event is triggered when ACF adds any new elements to the DOM.
    *
    *  @type  function
    *  @since  1.0.0
    *  @date  01/01/12
    *
    *  @param  event    e: an event object. This can be ignored
    *  @param  Element    postbox: An element which contains the new HTML
    *
    *  @return  n/a
    */

    $(document).on('acf/setup_fields', function(e, postbox){

      $(postbox).find('.field[data-field_type="collage"]').each(function(){

        initialize_field( $(this) );

      });

    });


  }


})(jQuery);
