if(!jQuery.fn.addBack){
  jQuery.fn.addBack = jQuery.fn.andSelf;
}

if(window.EEA === undefined){
  var EEA = {
    who: 'eea.annotator',
    version: '1.0'
  };
}

if(!EEA.eea_accordion){
  $.tools.tabs.addEffect("collapsed", function(i, done) {
      // #17555; passed an empty effect for the collapsed accordion
      // using instead use a simple slide for the accordion headers

  });
  EEA.eea_accordion = function ($folder_panels) {
    if (!$folder_panels) {
      $folder_panels = $('.eea-accordion-panels');
    }
    if ($folder_panels.length) {
      $folder_panels.each(function (idx, el) {
        var $el = $(el);
        var effect = 'slide';
        var current_class = "current";
        var initial_index = 0;
        var $pane = $el.find('.pane');

        if ($el.hasClass('collapsed-by-default')) {
          // hide all panels if using the above class
          effect = 'slide';
          initial_index = null;
          $pane.hide();
        }

        if ($el.hasClass('non-exclusive')) {
          // show the first panel only if we don't have also the
          // collapsed-by-default class
          if (!$el.hasClass('collapsed-by-default')) {
            $pane.not(':first').hide();
            $pane.eq(0).prev().addClass('current');
          }

          effect = 'collapsed';
          current_class = "default";
          // allow the hiding of the currently opened accordion
          $el.find('.eea-accordion-title, h2').click(function (ev) {
            var $el = $(this);
            if (!$el.hasClass('current')) {
              $el.addClass('current').next().slideDown();
            }
            else {
              $el.removeClass('current').next().slideUp();
            }
          });
        }

        $el.tabs($pane,
          {   tabs: '.eea-accordion-title, h2',
            effect: effect, initialIndex: initial_index,
            current: current_class,
            onBeforeClick: function (ev, idx) {
              // allows third party applications to hook into these 2 event handlers
              $(ev.target).trigger("eea-accordion-before-click", { event: ev, index: idx});
            },
            onClick: function (ev, idx) {
              $(ev.target).trigger("eea-accordion-on-click", { event: ev, index: idx});
            }
          }
        );
      });

    }
  };
}

EEA.AnnotatorWorker = {
  running: null,
  interval: 0,
  callback: null,

  start: function(interval, url, callback){
    var self = this;

    // Avoid multiple instances
    if(self.running){
      self.log('auto-sync already running');
      return;
    }

    if(interval <= 0){
      self.log('auto-sync is disabled');
      return;
    }

    self.url = url;
    self.callback = callback;

    self.log('auto-sync started. Running every ' + interval + 's');
    if(interval < 1000){
      interval *= 1000;
    }

    self.interval = interval;
    self.running = true;
    self.run();
  },

  stop: function(){
    var self = this;
    if(self.running){
      clearTimeout(self.running);
      self.running = null;
      self.log('auto-sync stopped');
    }
  },

  run: function(){
    var self = this;
    self.running = setTimeout(
      function(){
        self.callback("Auto-sync in progress: " + self.url);
//        jQuery.getJSON(self.url, {}, function(data){
//          self.callback(data);
//          return self.run();
//        });
      },
      self.interval
    );
  },

  log: function(msg){
    if(window.console){
      console.log('eea.annotator: ' + msg);
    }
  }
};


EEA.Annotator = function(context, options){
  var self = this;
  self.context = context;
  self.target = jQuery('#content');

  self.settings = {
    readOnly: self.context.data('readonly') || 0,
    autoSync: self.context.data('autosync') || 0,
    history: true,
    worker: '',
    prefix: '',
    user: {
      id: self.context.data('userid') || 'anonymous',
      name: self.context.data('username') || 'Anonymous'
    },
    urls: {
      create:  '/annotations_edit',
      read:    '/annotations_view/:id',
      update:  '/annotations_edit/:id',
      destroy: '/annotations_edit/:id',
      search:  '/annotations_search'
    }
  };

  if(options){
    jQuery.extend(self.settings, options);
  }

  self.initialize();
};

EEA.Annotator.prototype = {
  initialize: function(){
    var self = this;
    self.button = self.context.find('.annotator-button');
    self.button.attr('title', self.button.data('hide'));
    self.enabled = true;

    self.button.click(function(evt){
      evt.preventDefault();
      return self.click();
    });

    // Auto-sync inline comments
    self.worker = EEA.AnnotatorWorker;

    self.reload();
  },

  click: function(){
    var self = this;
    if(self.enabled){
      self.enabled = false;
      self.button.addClass('annotator-disabled');
      self.button.attr('title', self.button.data('show'));
      self.target.annotator('destroy');
      self.worker.stop();
    }else{
      self.enabled = true;
      self.button.removeClass('annotator-disabled');
      self.button.attr('title', self.button.data('hide'));
      self.reload();
    }
  },

  reload: function(){
    var self = this;

    // Init annotator
    self.target.annotator({
      readOnly: Boolean(self.settings.readOnly),
      exactMatch: true
    });

    // Add comment date
    self.target.annotator('addField', {
      load: function(field, annotation){
        var iso_date = annotation.created;
        if (iso_date.substr(iso_date.length-1) !== 'Z') {
          iso_date += 'Z';
        }
        var published = new Date(iso_date);
        var dateString = Util.easyDate(published);
        $(field)
          .html(dateString)
          .addClass('annotator-date')
          .attr('title', Util.prettyDateString(published));
      }
    });
    // Permissions plugin
    self.target.annotator('addPlugin', 'Permissions', {
      user: self.settings.user,
      userId: function(user){
        if(user && user.id){
          return user.id;
        }
        return user;
      },
      userString: function(user){
        return Util.userString(user);
      },
      permissions: {
        'read':   [],
        'update': [self.settings.user.id],
        'delete': [],
        'admin':  [self.settings.user.id]
      },
      showViewPermissionsCheckbox: false,
      showEditPermissionsCheckbox: false
    });

    // // Reply plugin
    self.target.annotator('addPlugin', 'Comment');

    // Storage plugin
    self.target.annotator('addPlugin', 'Store', {
      prefix: self.settings.prefix,
      urls: self.settings.urls,
      history: self.settings.history
    });

    // Errata plugin
    self.target.annotator('addPlugin', 'Errata');

    // Auto-sync inline comments in background
    self.worker.start(self.settings.autoSync, self.settings.worker, self.sync);
  },

  sync: function(data){
    var self = this;
    if(window.console){
      console.log(data);
    }
  }
};


jQuery.fn.EEAAnnotator = function(options){
  return this.each(function(){
    var context = jQuery(this);
    var adapter = new EEA.Annotator(context, options);
    context.data('EEAAnnotator', adapter);
  });
};


// EEA Annotator Portlet
EEA.AnnotatorPortlet = function(context, options){
  var self = this;
  self.context = context;
  self.settings = {

  };

  if(options){
    jQuery.extend(self.settings, options);
  }

  self.initialize();
};

EEA.AnnotatorPortlet.prototype = {
  initialize: function(){
    var self = this;
    self.header = self.context.find('.portletHeader');
    self.parent = self.context.parent();
    self.width = self.context.width();

    // Handle Events
    var errata = self.context.find('.annotator-errata');
    errata.off('.AnnotatorPortlet');
    errata.on('beforeClick.AnnotatorPortlet', function(evt, data){
      if(self.context.hasClass('fullscreen')){
        return self.highlight(data.annotation, data.element);
      }else{
        return self.fullscreen(data.annotation, data.element);
      }
    });

    errata.on('annotationsErrataLoaded.AnnotatorPortlet', function(evt, data){
      if(window.EEA && window.EEA.eea_accordion){
        EEA.eea_accordion(errata);
      }
    });

    // Fullscreen button
    jQuery('<span>')
      .attr('title', 'Toggle Full Screen Mode')
      .addClass('annotator-fullscreen-button')
      .addClass('eea-icon')
      .addClass('eea-icon-expand')
      .prependTo(self.header);

    self.header.find('.annotator-fullscreen-button,a').click(function(evt){
      evt.preventDefault();
      self.fullscreen();
    });

    jQuery('.annotator-portlet').on('commentCollapsed', '.erratum-comment', function(evt, data) {
      if (typeof tinymce !== 'undefined' ) {
        var quoted = data.annotation.quote;
        // Split newlines
        quoted = quoted.split('\n');
        var ed = tinymce.activeEditor;
        var ed_win = ed.getWin();

        var container_panel = $('#' + ed.editorId).closest('.formPanel');
        var tab_id = container_panel.find('legend').attr('id');
        $('a#' + tab_id).click();

        // scroll to tinymce
        jQuery('html, body').animate({
          scrollTop: jQuery('#' + ed.editorId).parent().offset().top
        });

        ed.focus();

        var start_range;
        var selection = ed.selection;

        for (var idx = 0, len = quoted.length; idx < len; idx++) {
          if (quoted[idx].length > 0) {
            ed_win.find(quoted[idx]);
            var current = selection.getRng();
            // Get the range for the first element - start_range
            if (idx === 0) {
              start_range = current.cloneRange();
            }
            
            // Add to the start_range the current range container and endOffset
            start_range.setEnd(current.startContainer, current.endOffset);
            selection.setRng(start_range);
          }
        }
      }
    });

    jQuery('.annotator-portlet').on('commentUnCollapsed', '.erratum-comment', function(evt, data) {
      if (typeof tinymce !== 'undefined' ) {
        var ed = tinymce.activeEditor;

        // Move caret to beginning of text
        ed.execCommand('SelectAll');
        ed.selection.collapse(true);
      }
    });

    jQuery('.annotator-portlet').on('portletEnterFS', function(evt) {
      var self = jQuery(this);
      var portletHeader = self.find('.portletHeader');
      var slider_width = self.outerWidth(true);
      var vert_mid = jQuery(window).scrollTop() + Math.floor(jQuery(window).height() / 2);

      self.addClass('unslided');

      var slide_div = jQuery('<div />', {
        'class': 'annotator-slide-button slide-right',
        click: function(evt){
          var parent = self;
          var btn = jQuery(this);
          var icon = btn.find('.eea-icon');
          evt.preventDefault();

          if (parent.hasClass('unslided')) {
            parent.animate({'margin-right': '-='+slider_width}, function() {
              parent.css('overflow', 'visible');
              parent.removeClass('unslided').addClass('slided');
              btn.removeClass('slide-right').addClass('slide-left');
              btn.css('right', slider_width);
              icon.removeClass('eea-icon-caret-right').addClass('eea-icon-caret-left');
            });
          } else {
            parent.animate({'margin-right': '+='+slider_width}, function() {
              parent.css('overflow', '');
              parent.removeClass('slided').addClass('unslided');
              btn.removeClass('slide-left').addClass('slide-right');
              icon.removeClass('eea-icon-caret-left').addClass('eea-icon-caret-right');
            });
          }
        }
      });

      var slide_btn = jQuery('<span />', {
        'class': 'eea-icon eea-icon-caret-right eea-icon-2x',
        'title': 'Slide the portlet to the right'
      });

      slide_btn.appendTo(slide_div);
      slide_div.width((slider_width - self.width()) / 2);
      self.append(slide_div);
    });

    jQuery('.annotator-portlet').on('portletExitFS', function(evt) {
      var self = jQuery(this);
      var slide_btn = self.find('.annotator-slide-button');
      slide_btn.remove();
    });
  },

  fullscreen: function(annotation, element){
    var self = this;

    var button = self.header.find('.annotator-fullscreen-button');
    if(self.context.hasClass('fullscreen')){
      self.context.slideUp(function(){
        button.removeClass('eea-icon-compress');
        button.addClass('eea-icon-expand');
        self.context.removeClass('fullscreen');
        self.context.width('auto');
        self.context.slideDown('fast');
        self.context.trigger('portletExitFS');
      });
    }else{
      self.context.slideUp(function(){
        button.addClass('eea-icon-compress');
        button.removeClass('eea-icon-expand');
        self.context.addClass('fullscreen');
        self.context.width(self.width);
        self.context.slideDown('fast');
        self.highlight(annotation, element);
        if(element && element.position){
          var scrollTop = element.position().top;
          self.context.animate({
            scrollTop: scrollTop
          });
        }
        self.context.trigger('portletEnterFS');
      });
    }
  },

  highlight: function(annotation, element){
    var self = this;
    var highlights = [];
    if(annotation && annotation.highlights){
      highlights = annotation.highlights;
    }
    jQuery('.annotator-hl').removeClass('hover');
    jQuery.each(highlights, function(idx, highlight){
      if(idx === 0){
        var scrollTop = jQuery(highlight).position().top;
        jQuery('html,body').animate({
          scrollTop: scrollTop
        });
      }
      jQuery(highlight).addClass('hover');
    });
  }
};

jQuery.fn.EEAAnnotatorPortlet = function(options){
  return this.each(function(){
    var context = jQuery(this);
    var adapter = new EEA.AnnotatorPortlet(context, options);
    context.data('EEAAnnotatorPortlet', adapter);
  });
};


jQuery(document).ready(function(){

  // Annotator
  var items = jQuery(".eea-annotator");
  if(items.length){
    var baseurl = jQuery('base').attr('href');
    if(baseurl.substring(baseurl.length - 1) === "/"){
      baseurl = baseurl.substring(0, baseurl.length - 1);
    }
    var settings = {
      worker: baseurl + '/annotator.api/annotations_view',
      prefix: baseurl + '/annotator.api'
    };

    items.EEAAnnotator(settings);
  }

  // Annotator Portlet
  items = jQuery('.annotator-portlet');
  if(items.length){
    items.EEAAnnotatorPortlet();
  }

});
