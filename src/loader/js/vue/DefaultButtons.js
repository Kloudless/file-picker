const BaseButton = {
  functional: true,
  render(createElement, context) {
    return createElement('button', {
      ...context.data, // passing attributes and event handlers
      domProps: {
        textContent: context.props.title,
      },
    });
  },
};

export const ChooserButton = {
  ...BaseButton,
  name: 'Chooser',
  props: {
    title: {
      type: String,
      default: 'Choose a file',
    },
  },
};

export const SaverButton = {
  ...BaseButton,
  name: 'Saver',
  props: {
    title: {
      type: String,
      default: 'Save a file',
    },
  },
};
