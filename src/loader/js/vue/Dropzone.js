import filePicker from '../interface';

const Dropzone = {
  name: 'dropzone',
  props: {
    options: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      id: `dz-${Math.floor(Math.random() * (10 ** 12))}`,
      dropzone: null,
    };
  },
  methods: {
    initDropzone() {
      // deep clone options
      const options = JSON.parse(JSON.stringify(this.options));
      options.elementId = this.id;
      this.dropzone = filePicker.dropzone(options);
      this.dropzone.on('raw', (...args) => {
        if (args[0] === 'dropzoneClicked') {
          args[0] = 'click';
        }
        this.$emit(...args);
      });
    },
  },
  watch: {
    options: {
      handler() {
        this.dropzone.destroy();
        this.initDropzone();
      },
      deep: true,
    },
  },
  template: `
    <div
      :id="id"
      :style="{'height':'100px', 'width':'600px'}">
    </div>`,
  mounted() {
    this.initDropzone();
  },
  destroyed() {
    this.dropzone.destroy();
  },
};

export default Dropzone;
