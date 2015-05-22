var get = Ember.get;

/**
  Renders a React component with the passed in options hash
  set as props.

  Usage:

  ```handlebars
    {{react 'my-component' value=value onChange=valueChanged}}
  ```
*/
var ReactComponent = Ember.Component.extend({

  _props: null,
  _reactComponent: null,
  componentName: null,
  tagName: 'div',

  // These cannot be unknown properties or else: https://github.com/emberjs/ember.js/issues/10400
  helperName: null,
  _morph: null,
  renderer: null,
  
  reactClass: Ember.computed(function() {
    var container = get(this, 'container'),
        name = get(this, 'componentName');

    return container.lookupFactory('react:' + name);
  }).property('componentName'),

  buildReactContext: function() {
    var container = get(this, 'container'),
        controller = get(this, 'controller');

    return {
      container: container,
      controller: controller
    };
  },

  renderReact: function() {
    var el = get(this, 'element'),
        reactClass = get(this, 'reactClass'),
        controller = get(this, 'controller'),
        context = this.buildReactContext();

    var props = this._props || {};
    props.model = props.model || get(controller, 'model');

    var descriptor = React.createElement(
      ContextWrapper(context, reactClass),
      this._props
    );

    this._reactComponent = React.render(descriptor, el);
  },

  didInsertElement: function() {
    this.renderReact();
  },

  willDestroyElement: function() {
    var el = get(this, 'element');
    React.unmountComponentAtNode(el);
  },

  unknownProperty: function(key) {
    return this._props && this._props[key];
  },

  setUnknownProperty: function(key, value) {
    if(!this._props) {
      this._props = {};
    }

    var that = this;
    var set = function(key, value) {
      var reactComponent = that._reactComponent;
      that._props[key] = value;
      if(reactComponent) {
        var props = {};
        props[key] = value;
        reactComponent.setProps(props);
      }
    };

    if (key.match(/Binding$/)) {
      var realKey = key.slice(0, -7);
      value.subscribe(function() {
        set(realKey, value.value());
      });
      set(realKey, value.value());
    } else {
      set(key, value);
    }

    return value;
  }

});

function ContextWrapper(context, Component) {
  
  var contextTypes = {};
  for(var key in context) {
    if(!context.hasOwnProperty(key)) continue;
    contextTypes[key] = React.PropTypes.any;
  }
  
  return React.createClass({
    
    childContextTypes: contextTypes,
    
    getChildContext: function() {
      return context;
    },
    
    render: function() {
      return <Component {...this.props} />;
    }
    
  });
    
}

export default ReactComponent;
