import fileExplorer from '../interface';
import { ChooserButton, SaverButton } from './DefaultButtons';

const create = fileExplorerType => (customComponent) => {
  const isChooser = fileExplorerType === 'chooser';
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
        explorer: null,
      };
    },
    methods: {
      choose(...args) {
        this.$emit('click', ...args);
        this.explorer.choose();
      },
      save(...args) {
        this.$emit('click', ...args);
        this.explorer.save();
      },
      initExplorer() {
        // deep clone options
        const options = JSON.parse(JSON.stringify(this.options));
        this.explorer = fileExplorer.explorer(options);
        this.explorer.on('raw', ({ action, data }) => {
          this.$emit(action, data);
        });
      },
    },
    watch: {
      options: {
        handler() {
          this.explorer.destroy();
          this.initExplorer();
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
      this.initExplorer();
    },
    destroyed() {
      this.explorer.destroy();
    },
  };
};

export const createChooser = create('chooser');
export const createSaver = create('saver');

export default {
  createChooser,
  createSaver,
};
