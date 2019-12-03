/* eslint-disable @typescript-eslint/no-unused-vars, no-console */

import filePicker, {
  Dropzone,
  ChooserOptions,
  FileMetadata,
  SaverStartFileUploadEvent,
  SaverFinishFileUploadEvent,
  Picker,
  OAuthQueryParams,
  ErrorEvent,
  SuccessEvent,
  SelectedEvent,
} from '../../src/loader/js/interface';

// test chooser
const options: ChooserOptions = {
  app_id: 'APP_ID',
  types: ['files'],
  multiselect: true,
  link: false,
  computer: true,
  services: ['all'],
  display_backdrop: true,
  oauth: (service) => {
    const authOptions: OAuthQueryParams = {};
    switch (service) {
      case 'gdrive':
        authOptions.scope = 'gdrive.storage."https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.readonly":raw'; // eslint-disable-line max-len
        authOptions.raw = {
          query_name: 'query_value',
        };
        break;
      case 'ftp':
        authOptions.form_data = {
          domain: 'ftps://ftp.example.com:21',
        };
        break;
      default:
        break;
    }
    return authOptions;
  },
};
const picker: Picker = Kloudless.filePicker.picker(options);
picker.choosify(document.getElementById('button'));
picker.update({
  link: true,
});
picker.on('success', (files: FileMetadata[]) => {
  files.forEach((file) => {
    console.log(file.id, file.name);
  });
});

// Test dropzone
const dropzone: Dropzone = filePicker.dropzone({
  app_id: 'APP_ID',
  elementId: 'ELEMENT_ID',
  copy_to_upload_location: 'async',
});

// test error event
const error: ErrorEvent = [
  {
    id: 'Fs_wC***',
    created: null,
    modified: '2019-11-12T16:50:48Z',
    size: 3510,
    path: '/kloudless-logo (1).png',
    ancestors: [
      {
        id: 'root',
        name: 'Dropbox',
        id_type: 'path',
      },
    ],
    parent: {
      id: 'root',
      name: 'Dropbox',
      id_type: 'path',
    },
    account: 12345,
    ids: {
      default: 'Fs_wC***',
      path: 'FbQ74***',
    },
    id_type: 'default',
    api: 'storage',
    type: 'file',
    name: 'kloudless-logo (1).png',
    mime_type: 'image/png',
    downloadable: true,
    raw_id: 'id:6e***',
    error: {
      status_code: 404,
      message: 'not_found',
      error_code: 'not_found',
      id: '23525***',
    },
  },
  {
    id: 'FSsx6***',
    created: null,
    modified: '2019-11-12T16:51:25Z',
    size: 3510,
    path: 'dev-previews/prod/ZJoG_UAHQlCXJeBM/kloudless-logo.png',
    ancestors: [
      {
        id: 'FSsx6***',
        name: 'ZJoG_UAHQlCXJeBM',
      },
      {
        id: 'FSsx6***',
        name: 'prod',
      },
      {
        id: 'Frsq6***',
        name: 'dev-previews',
      },
      {
        id: 'root',
        name: 'Amazon S3',
      },
    ],
    link: 'https://kloudl.es/l/o2w-_y33_rgspEd6ZfJt',
    parent: {
      id: 'FSsx6***',
      name: 'ZJoG_UAHQlCXJeBM',
    },
    account: 13579,
    api: 'storage',
    type: 'file',
    name: 'kloudless-logo.png',
    mime_type: 'image/png',
    downloadable: true,
    raw_id: 'dev-previews/prod/ZJoG_UAHQlCXJeBM/kloudless-logo.png',
  },
];

// test saver startUploadFile event
const saverStartFileUpload: SaverStartFileUploadEvent = {
  name: 'kloudless-logo2.png',
  url: 'https://s3-us-west-2.amazonaws.com/static-assets.kloudless.com/static/logo_white.png', // eslint-disable-line max-len
};

// test saver finishFileUpload event
const saverFinishFileUpload: SaverFinishFileUploadEvent = {
  name: 'kloudless-logo.png',
  url: 'https://s3-us-west-2.amazonaws.com/static-assets.kloudless.com/static/logo_white.png', // eslint-disable-line max-len
  metadata: {
    id: 'Fs_wCY***',
    created: null,
    modified: '2019-11-13T03:08:56Z',
    size: 3510,
    path: '/kloudless-logo (1).png',
    ancestors: [
      {
        id: 'root',
        name: 'Dropbox',
        id_type: 'path',
      },
    ],
    parent: {
      id: 'root',
      name: 'Dropbox',
      id_type: 'path',
    },
    account: 12345,
    id_type: 'default',
    api: 'storage',
    type: 'file',
    name: 'kloudless-logo (1).png',
    mime_type: 'image/png',
    downloadable: true,
    raw_id: 'id:6e***',
  },
};

// test saver success event
const saverSuccess: SuccessEvent = [
  {
    id: 'Fs_wCY***',
    created: null,
    modified: '2019-11-13T03:08:56Z',
    size: 3510,
    path: '/kloudless-logo (1).png',
    ancestors: [
      {
        id: 'root',
        name: 'Dropbox',
        id_type: 'path',
      },
    ],
    parent: {
      id: 'root',
      name: 'Dropbox',
      id_type: 'path',
    },
    account: 12345,
    id_type: 'default',
    api: 'storage',
    type: 'file',
    name: 'kloudless-logo (1).png',
    mime_type: 'image/png',
    downloadable: true,
    raw_id: 'id:6e***',
  },
  {
    id: 'Fs_wC***',
    created: null,
    modified: '2019-11-13T03:08:58Z',
    size: 3510,
    path: '/kloudless-logo2.png',
    ancestors: [
      {
        id: 'root',
        name: 'Dropbox',
        id_type: 'path',
      },
    ],
    parent: {
      id: 'root',
      name: 'Dropbox',
      id_type: 'path',
    },
    account: 12345,
    id_type: 'default',
    api: 'storage',
    type: 'file',
    name: 'kloudless-logo2.png',
    mime_type: 'image/png',
    downloadable: true,
    raw_id: 'id:6e***',
  },
];

// test chooser success event with copy_to_upload_location=true
const successWithCopyToUploadLocationAsync: SuccessEvent = [
  {
    id: '4c025***',
    state: 'PENDING',
  },
  {
    id: 'c2ac3***',
    state: 'PENDING',
  },
];

// test chooser success event with copy_to_upload_location = false
const successWithCopyToUploadLocationSync: SuccessEvent = [
  {
    id: 'FSsx6***',
    created: null,
    modified: '2019-11-13T03:16:37Z',
    size: 3510,
    path: 'dev-previews/prod/GSwTOIjWLRjt0fEd/kloudless-logo (1).png',
    ancestors: [
      {
        id: 'FSsx6***',
        name: 'GSwTOIjWLRjt0fEd',
      },
      {
        id: 'FSsx6***',
        name: 'prod',
      },
      {
        id: 'Frsq6***',
        name: 'dev-previews',
      },
      {
        id: 'root',
        name: 'Amazon S3',
      },
    ],
    link: 'https://kloudl.es/l/zBaJj***',
    parent: {
      id: 'FSsx6***',
      name: 'GSwTOIjWLRjt0fEd',
    },
    account: 13579,
    api: 'storage',
    type: 'file',
    name: 'kloudless-logo (1).png',
    mime_type: 'image/png',
    downloadable: true,
    raw_id: 'dev-previews/prod/GSwTOIjWLRjt0fEd/kloudless-logo (1).png',
  },
  {
    id: 'FSsx6***',
    created: null,
    modified: '2019-11-13T03:16:37Z',
    size: 3510,
    path: 'dev-previews/prod/x9bapKEL80_CaR81/kloudless-logo.png',
    ancestors: [
      {
        id: 'FSsx6***',
        name: 'x9bapKEL80_CaR81',
      },
      {
        id: 'FSsx6***',
        name: 'prod',
      },
      {
        id: 'Frsq6***',
        name: 'dev-previews',
      },
      {
        id: 'root',
        name: 'Amazon S3',
      },
    ],
    link: 'https://kloudl.es/l/Vpw06NMEHSh4fiO0an7e',
    parent: {
      id: 'FSsx6***',
      name: 'x9bapKEL80_CaR81',
    },
    account: 13579,
    api: 'storage',
    type: 'file',
    name: 'kloudless-logo.png',
    mime_type: 'image/png',
    downloadable: true,
    raw_id: 'dev-previews/prod/x9bapKEL80_CaR81/kloudless-logo.png',
  },
];

// test chooser success event with type = folder
const successFolder: SuccessEvent = [
  {
    id: 'FSsx6***',
    created: null,
    modified: null,
    size: null,
    path: 'dev-previews/prod/z2YmF-S_ghH2U3Wy/kloudless-fe-upload/',
    ancestors: [
      {
        id: 'FSsx6***',
        name: 'z2YmF-S_ghH2U3Wy',
      },
      {
        id: 'FSsx6***',
        name: 'prod',
      },
      {
        id: 'Frsq6***',
        name: 'dev-previews',
      },
      {
        id: 'root',
        name: 'Amazon S3',
      },
    ],
    parent: {
      id: 'FSsx6***',
      name: 'z2YmF-S_ghH2U3Wy',
    },
    account: 13579,
    api: 'storage',
    name: 'kloudless-fe-upload',
    type: 'folder',
    can_create_folders: true,
    can_upload_files: true,
    raw_id: 'dev-previews/prod/z2YmF-S_ghH2U3Wy/kloudless-fe-upload/',
  },
];

// test chooser selected event with type = file
const selectedFile: SelectedEvent = [
  {
    id: 'Fs_wCY***',
    created: null,
    modified: '2019-11-13T03:08:56Z',
    size: 3510,
    path: '/kloudless-logo (1).png',
    ancestors: [
      {
        id: 'root',
        name: 'Dropbox',
        id_type: 'path',
      },
    ],
    parent: {
      id: 'root',
      name: 'Dropbox',
      id_type: 'path',
    },
    account: 12345,
    ids: {
      default: 'Fs_wCY***',
      path: 'FbQ74***',
    },
    id_type: 'default',
    api: 'storage',
    type: 'file',
    name: 'kloudless-logo (1).png',
    mime_type: 'image/png',
    downloadable: true,
    raw_id: 'id:6e***',
  },
  {
    id: 'Fs_wC***',
    created: null,
    modified: '2019-10-03T08:05:48Z',
    size: 3510,
    path: '/kloudless-logo.png',
    ancestors: [
      {
        id: 'root',
        name: 'Dropbox',
        id_type: 'path',
      },
    ],
    parent: {
      id: 'root',
      name: 'Dropbox',
      id_type: 'path',
    },
    account: 12345,
    ids: {
      default: 'Fs_wC***',
      path: 'F5LI0LGfl0wfuuxhwFGawJaQVb9ml3UpU9esJubxmaR0=',
    },
    id_type: 'default',
    api: 'storage',
    type: 'file',
    name: 'kloudless-logo.png',
    mime_type: 'image/png',
    downloadable: true,
    raw_id: 'id:6e7mtBeH4sAAAAAAAADOaw',
  },
];
