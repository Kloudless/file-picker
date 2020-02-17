/* eslint-disable max-len */

declare global {
  namespace Kloudless.filePicker {

    function picker(options: ChooserOptions | SaverOptions): Picker;
    function dropzone(options: DropzoneOptions): Dropzone;
    function getGlobalOptions(): BuildOptions;
    function setGlobalOptions(buildOptions: Partial<BuildOptions>);

    /**
     * See https://github.com/kloudless/file-picker#methods
     */
    interface Picker extends Events {
      choose(): void;
      choosify(element: HTMLElement): void;
      save(files: File[]): void;
      savify(element: HTMLElement, files: File[]): void;
      close(): void;
      destroy(): void;
      update(options: UpdateOptions): void;
      logout(deleteAccount?: boolean): void;
    }

    /**
     * See https://github.com/kloudless/file-picker#methods-1
     */
    interface Dropzone extends DropzoneEvents {
      close(): void;
      destroy(): void;
      update(options: DropzoneUpdateOptions): void;
    }

    type PersistMode = 'none' | 'local' | 'session';
    type ServiceGroup = 'file_store' | 'object_store' | 'construction' | 'all';
    /**
     * Please refer to https://developers.kloudless.com/docs/latest/storage
     * for the full list of suppoerted services.
     */
    type ServiceName = string;
    type ServiceCategory = 'all' | 'folders' | 'files' | 'text' | 'documents'
      | 'images' | 'videos' | 'audio';
    type FileExtension = string;
    type NotUpdatableOptions = 'app_id' | 'custom_css' | 'types' | 'services'
      | 'persist' | 'create_folder' | 'account_key' | 'elementId';
    type UpdateOptions = Partial<Omit<(ChooserOptions & SaverOptions), NotUpdatableOptions>>;
    type DropzoneUpdateOptions = Partial<Omit<DropzoneOptions, NotUpdatableOptions>>;

    interface File {
      name: string;
      url: string;
    }

    interface LinkOptions {
      password?: string;
      expiration?: string;
      direct?: boolean;
    }

    /**
     * See https://github.com/kloudless/file-picker#chooser-and-saver
     */
    interface BaseOptions {
      app_id: string;
      retrieve_token?: boolean;
      computer?: boolean;
      persist?: PersistMode;
      services?: (ServiceName | ServiceGroup)[];
      account_management?: boolean;
      display_backdrop?: boolean;
      // TODO: deprecate in v2
      custom_css?: string;
      /**
       * Please refer to https://github.com/kloudless/file-picker#chooser-and-saver
       * for the usage of `locale` option.
       */
      locale?: string;
      /**
       * Please refer to https://github.com/kloudless/file-picker#chooser-and-saver
       * for the usage of `translations` option.
       */
      translations?: string | object;
      dateTimeFormat?: string;
      create_folder?: boolean;
      /**
       * @deprecated Please use the `retrieve_token` option instead.
       */
      account_key?: boolean;
      /**
       * @deprecated Please use the `retrieve_token` option instead.
       */
      keys?: string[];
      tokens?: string[];
      enable_logout?: boolean;
      delete_accounts_on_logout?: boolean;

      oauth?(service: ServiceName): OAuthQueryParams;

      root_folder_id?: { [key: number]: string; }
    }

    /**
     * See https://github.com/kloudless/file-picker#chooser-and-saver
     */
    interface ChooserOptions extends BaseOptions {
      multiselect?: boolean;
      link?: boolean;
      link_options?: LinkOptions;
      copy_to_upload_location?: 'async' | 'sync';
      upload_location_account?: string;
      upload_location_folder?: string;
      uploads_pause_on_error?: boolean;
      types?: (FileExtension | ServiceCategory)[];
    }

    /**
     * See https://github.com/kloudless/file-picker#chooser-and-saver
     */
    interface SaverOptions extends BaseOptions {
      files: File[];
    }

    interface DropzoneOptions extends ChooserOptions {
      elementId: string;
      copy_to_upload_location: 'async' | 'sync';
      computer?: true;
    }

    interface BuildOptions {
      pickerUrl?: string;
    }

    /**
     * See https://developers.kloudless.com/docs/v1/authentication#oauth-2.0.
     */
    interface OAuthQueryParams {
      scope?: string;
      oob_loading_delay?: number;
      custom_properties?: object;
      raw?: object;
      /**
       * @deprecated Please use the `form_data` option instead.
       */
      extra_data?: object;
      form_data?: object;
    }

    type SuccessEvent = Array<FileMetadata | FolderMetadata | Task>;
    type ErrorEvent = Array<FileMetadata | FolderMetadata | Task>;
    type SelectedEvent = FileMetadata[] | FolderMetadata[];
    type StartFileUploadEvent = ChooserStartFileUploadEvent | SaverStartFileUploadEvent;
    type FinishFileUploadEvent = ChooserFinishFileUploadEvent | SaverFinishFileUploadEvent;

    /**
     * See https://github.com/kloudless/file-picker#events
     */
    interface Events {
      on(event: 'success', callback: (event: SuccessEvent) => void): void;
      on(event: 'cancel', callback: () => void): void;
      on(event: 'error', callback: (event: ErrorEvent) => void): void;
      on(event: 'open', callback: () => void): void;
      on(event: 'close', callback: () => void): void;
      on(event: 'selected', callback: (event: SelectedEvent) => void): void;
      on(event: 'addAccount', callback: (account: Account) => void): void;
      on(event: 'deleteAccount', callback: (accountId: number) => void): void;
      on(event: 'startFileUpload', callback: (event: StartFileUploadEvent) => void): void;
      on(event: 'finishFileUpload', callback: (event: FinishFileUploadEvent) => void): void;
      on(event: 'logout', callback: () => void): void;
    }

    /**
     * See https://github.com/kloudless/file-picker#events
     */
    type DropzoneEvents = Events & {
      on(event: 'drop', callback: () => void): void;
    }

    interface BaseMetadata {
      id: string;
      name: string;
      size: number | null;
      created: string | null;
      modified: string | null;
      type: string;
      account: number;
      parent: ParentMetadata;
      ancestors: ParentMetadata[] | null;
      path: string | null;
      /**
       * @deprecated
       */
      raw_id: string;
      owner?: UserMetadata;
      creator?: UserMetadata;
      last_modifier?: UserMetadata;
      api: 'storage';
      ids?: IdsMetadata;
      id_type?: keyof IdsMetadata;
      bearer_token?: {
        key: string;
      };
      error?: Error;
      /**
       * In case Kloudless API introduces new properties but hasn't updated here.
       * Please notify us by creating GitHub issues: https://github.com/kloudless/file-picker/issues.
       */
      [x: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    /**
     * See https://developers.kloudless.com/docs/latest/storage#files
     */
    interface FileMetadata extends BaseMetadata {
      type: 'file';
      mime_type: string;
      downloadable: boolean;
      link?: string;
    }

    /**
     * See https://developers.kloudless.com/docs/latest/storage#folders
     */
    interface FolderMetadata extends BaseMetadata {
      type: 'folder';
      can_create_folders: boolean;
      can_upload_files: boolean;
    }

    interface UserMetadata {
      id: string;
    }

    interface ParentMetadata {
      id: string;
      name: string;
      id_type?: keyof IdsMetadata;
    }

    interface IdsMetadata {
      default?: string;
      shared?: string;
      path?: string;
      version?: string;
    }

    interface Error {
      status_code: number;
      message: string;
      error_code: string;
      id: string;
    }

    interface Account {
      id: string;
      name: string;
      service: ServiceName;
    }

    interface ChooserStartFileUploadEvent {
      id: string;
      name: string;
      size: number;
      mime_type: string;
    }

    interface SaverStartFileUploadEvent {
      url: string;
      name: string;
    }

    interface ChooserFinishFileUploadEvent extends ChooserStartFileUploadEvent {
      metadata: FileMetadata;
    }

    interface SaverFinishFileUploadEvent extends SaverStartFileUploadEvent {
      metadata: FileMetadata;
    }

    /**
     * See https://developers.kloudless.com/docs/latest/core#asynchronous-requests-and-the-task-api
     */
    interface Task {
      id: string;
      state: 'PENDING' | 'RECEIVED' | 'STARTED';
    }
  }
}

export default Kloudless.filePicker;
export type PersistMode = Kloudless.filePicker.PersistMode;
export type ServiceGroup = Kloudless.filePicker.ServiceGroup;
export type ServiceName = Kloudless.filePicker.ServiceName;
export type ServiceCategory = Kloudless.filePicker.ServiceCategory;
export type FileExtension = Kloudless.filePicker.FileExtension;
export type UpdateOptions = Kloudless.filePicker.UpdateOptions;
export type DropzoneUpdateOptions = Kloudless.filePicker.DropzoneUpdateOptions;
export type SuccessEvent = Kloudless.filePicker.SuccessEvent;
export type ErrorEvent = Kloudless.filePicker.ErrorEvent;
export type SelectedEvent = Kloudless.filePicker.SelectedEvent;
export type StartFileUploadEvent = Kloudless.filePicker.StartFileUploadEvent;
export type FinishFileUploadEvent = Kloudless.filePicker.FinishFileUploadEvent;
export type ChooserStartFileUploadEvent = Kloudless.filePicker.ChooserStartFileUploadEvent;
export type SaverStartFileUploadEvent = Kloudless.filePicker.SaverStartFileUploadEvent;
export type ChooserFinishFileUploadEvent = Kloudless.filePicker.ChooserFinishFileUploadEvent;
export type SaverFinishFileUploadEvent = Kloudless.filePicker.SaverFinishFileUploadEvent;
export type Picker = Kloudless.filePicker.Picker;
export type Dropzone = Kloudless.filePicker.Dropzone;
export type File = Kloudless.filePicker.File;
export type LinkOptions = Kloudless.filePicker.LinkOptions;
export type BaseOptions = Kloudless.filePicker.BaseOptions;
export type ChooserOptions = Kloudless.filePicker.ChooserOptions;
export type SaverOptions = Kloudless.filePicker.SaverOptions;
export type DropzoneOptions = Kloudless.filePicker.DropzoneOptions;
export type BuildOptions = Kloudless.filePicker.BuildOptions;
export type OAuthQueryParams = Kloudless.filePicker.OAuthQueryParams;
export type Events = Kloudless.filePicker.Events;
export type BaseMetadata = Kloudless.filePicker.BaseMetadata;
export type FileMetadata = Kloudless.filePicker.FileMetadata;
export type FolderMetadata = Kloudless.filePicker.FolderMetadata;
export type UserMetadata = Kloudless.filePicker.UserMetadata;
export type ParentMetadata = Kloudless.filePicker.ParentMetadata;
export type IdsMetadata = Kloudless.filePicker.IdsMetadata;
export type Error = Kloudless.filePicker.Error;
export type Account = Kloudless.filePicker.Account;
export type Task = Kloudless.filePicker.Task;
