import { action } from '@storybook/addon-actions';
import { text, object, boolean } from '@storybook/addon-knobs';

const EVENTS = [
  'success',
  'cancel',
  'error',
  'open',
  'close',
  'selected',
  'addAccount',
  'deleteAccount',
  'startFileUpload',
  'finishFileUpload',
  'logout',
  'click',
  'drop',
];

/**
 * generate event handlers that managed by storybook-action
 */
function genEventHandlers(name) {
  return EVENTS.reduce((result, event) => {
    result[event] = action(`(${name}) received '${event}' event`);
    return result;
  }, {});
}

export const CustomButton = {
  name: 'custom-button',
  template: `
    <button
      class="btn btn-success"
      type="button">
      Custom Button
    </button>`,
};

export const HintComponent = {
  template: `
    <ul class="list-unstyled">
      You can play with the buttons below and see how it works in the right
      panel:
      <li>
        <strong>Knobs </strong>
        edit props (ex: options.app_id, title)
      </li>
      <li>
        <strong>Actions </strong>
        print logs and arguments of event listeners
      </li>
      <li>
        <strong>* </strong>
        We use bootstrap CSS here for demonstration
      </li>
    </ul>`,
};

const ExampleWrapperComponent = {
  props: ['name'],
  template: `
    <div class="mb-3">
      <h4>{{ name }} Example</h4>
      <div>
        <slot></slot>
      </div>
    </div>
  `,
};

/**
 * create element in following mockup:
 * <ExampleWrapperComponent v-bind:name="...">
 *  <component v-bind="..." v-on="..." />
 * </ExampleWrapperComponent>
 */
export function createExampleElement(createElement, component) {
  const getKnobProps = obj => Object.keys(obj).reduce((result, key) => {
    result[key] = this.$props[`${component.name}${key}`];
    return result;
  }, {});
  return createElement(
    ExampleWrapperComponent,
    { props: { name: component.name } },
    [
      createElement(
        component.component,
        {
          props: getKnobProps(component.props),
          attrs: getKnobProps(component.attrs),
          on: genEventHandlers(component.name),
        },
      ),
    ],
  );
}


function genKnobProp(compName, propName, value) {
  const typeMap = {
    string: [String, text],
    object: [Object, object],
    boolean: [Boolean, boolean],
  };
  const type = typeof value;
  if (type in typeMap) {
    const [dataType, knobType] = typeMap[type];
    return {
      type: dataType,
      default: knobType(`(${compName}) ${propName}`, value, compName),
    };
  }
  throw Error(`genProp() error: un-expected type '${typeof value}'`);
}

/**
 * generate Vue props that managed by storybook-knobs
 */
export function genProps(components) {
  return components.reduce((result, comp) => {
    const { props, attrs, name: compName } = comp;
    Object.keys(props).forEach((prop) => {
      result[`${compName}${prop}`] = genKnobProp(compName, prop, props[prop]);
    });
    Object.keys(attrs).forEach((attr) => {
      result[`${compName}${attr}`] = genKnobProp(compName, attr, attrs[attr]);
    });
    return result;
  }, {});
}
