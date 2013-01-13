WebRemixer.Views.Timeline = Backbone.View.extend({
  className: 'timeline',
  
  events: {
    'click .toggle-height' : 'onToggleHeightClick',
    'drop .timeline-clips' : 'onDrop'
  },

  initialize: function(){
    _.bindAll(this);
  
    this.$el
      .attr({
        id: this.model.cid,
        'data-num': this.model.get('num')
      })
      .data('view', this);
      
    this.$header = $('<div/>')
      .addClass('header')
      .attr({
        'data-title': 'Timeline %s'.sprintf(this.model.get('num'))
      })
      .appendTo(this.el);
      
    this.$toggleHeight = $('<button class="toggle-height"/>')
      .button({
        icons: {
          primary: 'ui-icon-circle-triangle-s',
        },
        label: 'Collapse',
        text: false
      }).appendTo(this.$header);
      
    this.$timelineClips = $('<div/>').addClass('timeline-clips').droppable({
      accept: '.clip, .timeline-clip',
      tolerance: 'pointer'
    }).appendTo(this.el);
      
    $('<div/>').addClass('selection').appendTo(this.el);
    

    this.listenTo(this.model, {
      'change:collapsed': this.onCollapsedChange,
      'change:remix': this.onRemixChange
    });
    
    this.listenTo(this.model.get('remix'), 'change:selection', this.onSelectionChange);
    
    this.model.trigger('change:remix');
  },
  
  onRemixChange: function(){
    var remix = this.model.get('remix');
    
    if (!remix){
      this.$el.remove();
      return;
    }
  
    var self = this;
  
    var timelines = $.single('.remix#%s > .timelines'.sprintf(remix.cid));
    
    //insert timeline in the correct position
    timelines.children('.timeline').each(function(){
      if ($(this).attr('data-num') > self.model.get('num')){
        self.$el.insertBefore(this);
        return false;
      }
    });
    
    //if not inserted, insert the timeline
    if (!this.$el.parent().length){
      timelines.append(this.el);
    }
  },
  
  onToggleHeightClick: function(){
    this.model.set('collapsed', !this.model.get('collapsed'));
  },
  
  onCollapsedChange: function(){
    var collapsed = this.model.get('collapsed');
    
    if (collapsed){
      this.$el.addClass('collapsed');
      this.$toggleHeight.button('option', {
					label: 'Expand',
					icons: {
						primary: 'ui-icon-circle-triangle-n'
					}
    	});
    }else{
      this.$el.removeClass('collapsed');
      this.$toggleHeight.button('option', {
				label: 'Collapse',
				icons: {
					primary: 'ui-icon-circle-triangle-s'
				}
			});
    }
  },
  
  duplicateSelection: function(){
    var duration = this.model.get('selection').duration;
  
    var $selectedClips = this.getSelectedClips();
    if (!$selectedClips) return;
    
    $selectedClips.each(function(){
      $(this).data('view').duplicate(duration);
    })
    
  },
  
  deleteSelection: function(){
    var $selectedClips = this.getSelectedClips();
    if (!$selectedClips) return;
    
    $selectedClips.each(function(){
      $(this).data('view').del();
    });
  },
  
  getSelectedClips: function(){
    var selection = this.model.get('selection');
    if (!selection) return;
    
    var $selectedClips = this.$timelineClips.find('.timeline-clip.ui-selected');

    return $selectedClips.size() && $selectedClips;
  },
  
  onSelectionChange: function(){
  
    var selection = this.model.get('remix').get('selection');
    
    var offset = this.$el.offset();
    var height = this.$el.height();
    
    var $selection = this.$el.single('.selection');
    
    //make sure selection is at least 1x1 and check for the 3 types of intersections
    if (selection.width >= 1 && selection.height >= 1 &&
        ((selection.offset.top >= offset.top && selection.offset.top <= offset.top + height)
        || (selection.offset.top + selection.height >= offset.top && selection.offset.top + selection.height <= offset.top + height)
        || (selection.offset.top <= offset.top && selection.offset.top + selection.height >= offset.top + height))) {
      $selection.css({
        left: selection.offset.left,
        width: selection.width
      });
      this.model.set('selection', {
        startTime: (selection.offset.left - this.$timelineClips.offset().left) / WebRemixer.PX_PER_SEC,
        duration: selection.width / WebRemixer.PX_PER_SEC
      });
    }else{
      $selection.css({
        width: 0
      });
      this.model.set('selection', null);
    }
  },
  
  onDrop: function(event, ui){
    var view = ui.draggable.data('view');
    
    if (view instanceof WebRemixer.Views.TimelineClip){
      view.model.set('timeline', this.model);
    }else if (view instanceof WebRemixer.Views.Clip){
      new WebRemixer.Views.TimelineClip({
        model: 
          new WebRemixer.Models.TimelineClip({
            timeline: this.model,
            clip: view.model,
            startTime: (ui.offset.left - this.$timelineClips.offset().left) / WebRemixer.PX_PER_SEC,
            loop: true
          })
      });
    }
  },
  
  render: function(){
    
  }
});