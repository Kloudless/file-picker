import filePicker from '../interface';
import { ChooserButton, SaverButton } from './DefaultButtons';

const create = filePickerType => (customComponent) => {
  const isChooser = filePickerType === 'chooser';
  const wrappedComponent = customComponent || (
    isChooser ? ChooserButton : SaverButton);
  const wrappedCompName = wrappedComponent.name || 'component';
  return {
    name: isChooser
      ? `createChooser-${wrappedCompName}`
      : `createSaver-${wrappedCompName}`,
    props: {
      ...wrappedComponent.props,
      options: {
        type: Object,
        required: true,
      },
    },
    data() {
      return {
        picker: null,
      };
    },
    methods: {
      choose(...args) {
        this.$emit('click', ...args);
        this.picker.choose();
      },
      save(...args) {
        this.$emit('click', ...args);
        this.picker.save();
      },
      initPicker() {
        // deep clone options
        const options = JSON.parse(JSON.stringify(this.options));
        if (this.options.oauth) {
          options.oauth = this.options.oauth;
        }
        this.picker = filePicker.picker(options);
        this.picker.on('raw', ({ action, data }) => {
          this.$emit(action, data);
        });
      },
    },
    watch: {
      options: {
        handler() {
          this.picker.destroy();
          this.initPicker();
        },
        deep: true,
      },
    },
    render(createElement) {
      const { options, ...restProps } = this.$props;
      const element = createElement(wrappedComponent, {
        props: restProps,
        attrs: this.$attrs,
        // Listen for native click event if the wrapped component doesn't
        // explicitly emit it.
        nativeOn: {
          click: isChooser ? this.choose : this.save,
        },
        // Bind listeners to the wrapped component
        on: {
          ...this.$listeners,
          click: isChooser ? this.choose : this.save,
        },
      });
      return element;
    },
    mounted() {
      this.initPicker();
    },
    destroyed() {
      this.picker.destroy();
    },
  };
};

export const createChooser = create('chooser');
export const createSaver = create('saver');

export default {
  createChooser,
  createSaver,
};
