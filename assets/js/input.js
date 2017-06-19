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

    var gridUnitSize = getGridUnitSize();
    var canvasWidth = getCanvasWidth();
    var canvasHeight = getCanvasHeight();

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

    collageInit();

    $(window).resize( $.debounce( 250, resizeEvents ) );

    var windowWidth = $(window).width();

    function resizeEvents() {
      if ( $(window).width() == windowWidth ) return;
      windowWidth = $(window).width();

      gridUnitSize = getGridUnitSize();
      canvasWidth = getCanvasWidth();
      canvasHeight = getCanvasHeight();

      $collageItems.resizable('destroy')
                   .draggable('destroy');

      collageInit();
    }

    $collageItems.on('resizestop dragstop', function(e, ui) {
      var $item = $(ui.helper);
      var index = $item.index('.collage-item');

      inputData[index] = inputData[index] || {};

      if ( ui.size ) {
        inputData[index]['columns'] = Math.round( ui.size.width / gridUnitSize );
      }

      if ( ui.position ) {
        inputData[index]['positionLeft'] = ui.position.left / canvasWidth * 100;
        inputData[index]['positionTop'] = ui.position.top / canvasHeight * 100;

        inputData[index]['columnOffset'] = Math.round( ui.position.left / gridUnitSize );
      }

      updateZIndexes();

      $input.val( JSON.stringify( inputData ) );
    });

    function collageInit() {
      setInitialPosition();

      $collageItems.resizable(resizableOptions)
                   .draggable(draggableOptions);

      $collageItems.each(function() {
        var $item = $(this);
        var initialZIndex = $item.css('zIndex');

        if ( $item.attr('data-first-initialization') == 'true' ) {
          $item.simulate('drag');
        }

        $item.css({ zIndex: initialZIndex });
      });
    }

    function setInitialPosition() {
      $collageItems.each(function() {
        var $item = $(this);
        var top = parseInt( $item.attr('data-top') );
        var left = parseInt( $item.attr('data-left') );
        var height = $item.outerHeight();

        if ( !isNaN( top ) ) {
          $item.css({ top: canvasHeight * ( top / 100 ) });
        }

        if ( !isNaN( left ) ) {
          $item.css({ left: canvasWidth * ( left / 100 ) });
        }

        if ( !isNaN( height ) ) {
          $item.css({
            height: height,
            paddingBottom: ''
           });
        }
      });
    }

    function updateZIndexes() {
      $collageItems.each(function(index) {
        var $item = $(this);

        inputData[index] = inputData[index] || {};

        inputData[index]['zIndex'] = inputData[index]['zIndex'] || $item.css('zIndex') || 0;
      });
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
      return Math.floor( $canvas.width() / 12 );
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
