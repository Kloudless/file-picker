/* eslint-disable max-len */

declare global {
  namespace Kloudless.fileExplorer {

    function explorer(options: ChooserOptions | SaverOptions): Explorer;
    function dropzone(options: DropzoneOptions): Dropzone;
    function getGlobalOptions(): BuildOptions;
    function setGlobalOptions(buildOptions: Partial<BuildOptions>);

    /**
     * See https://github.com/Kloudless/file-explorer#methods
     */
    interface Explorer extends Events {
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
     * See https://github.com/Kloudless/file-explorer#methods-1
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
     * See https://github.com/Kloudless/file-explorer#chooser-and-saver
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
       * Please refer to https://github.com/Kloudless/file-explorer#chooser-and-saver
       * for the usage of `locale` option.
       */
      locale?: string;
      /**
       * Please refer to https://github.com/Kloudless/file-explorer#chooser-and-saver
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
    }

    /**
     * See https://github.com/Kloudless/file-explorer#chooser-and-saver
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
     * See https://github.com/Kloudless/file-explorer#chooser-and-saver
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
      explorerUrl?: string;
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

    type SuccessEvent = FileMetadata[] | FolderMetadata[] | Task[];
    type ErrorEvent = Array<FileMetadata | FolderMetadata | Task>;
    type SelectedEvent = FileMetadata[] | FolderMetadata[];
    type StartFileUploadEvent = ChooserStartFileUploadEvent | SaverStartFileUploadEvent;
    type FinishFileUploadEvent = ChooserFinishFileUploadEvent | SaverFinishFileUploadEvent;

    /**
     * See https://github.com/Kloudless/file-explorer#events
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
     * See https://github.com/Kloudless/file-explorer#events
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
       * Please notify us by creating GitHub issues: https://github.com/Kloudless/file-explorer/issues.
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

export default Kloudless.fileExplorer;
export type PersistMode = Kloudless.fileExplorer.PersistMode;
export type ServiceGroup = Kloudless.fileExplorer.ServiceGroup;
export type ServiceName = Kloudless.fileExplorer.ServiceName;
export type ServiceCategory = Kloudless.fileExplorer.ServiceCategory;
export type FileExtension = Kloudless.fileExplorer.FileExtension;
export type UpdateOptions = Kloudless.fileExplorer.UpdateOptions;
export type DropzoneUpdateOptions = Kloudless.fileExplorer.DropzoneUpdateOptions;
export type SuccessEvent = Kloudless.fileExplorer.SuccessEvent;
export type ErrorEvent = Kloudless.fileExplorer.ErrorEvent;
export type SelectedEvent = Kloudless.fileExplorer.SelectedEvent;
export type StartFileUploadEvent = Kloudless.fileExplorer.StartFileUploadEvent;
export type FinishFileUploadEvent = Kloudless.fileExplorer.FinishFileUploadEvent;
export type ChooserStartFileUploadEvent = Kloudless.fileExplorer.ChooserStartFileUploadEvent;
export type SaverStartFileUploadEvent = Kloudless.fileExplorer.SaverStartFileUploadEvent;
export type ChooserFinishFileUploadEvent = Kloudless.fileExplorer.ChooserFinishFileUploadEvent;
export type SaverFinishFileUploadEvent = Kloudless.fileExplorer.SaverFinishFileUploadEvent;
export type Explorer = Kloudless.fileExplorer.Explorer;
export type Dropzone = Kloudless.fileExplorer.Dropzone;
export type File = Kloudless.fileExplorer.File;
export type LinkOptions = Kloudless.fileExplorer.LinkOptions;
export type BaseOptions = Kloudless.fileExplorer.BaseOptions;
export type ChooserOptions = Kloudless.fileExplorer.ChooserOptions;
export type SaverOptions = Kloudless.fileExplorer.SaverOptions;
export type DropzoneOptions = Kloudless.fileExplorer.DropzoneOptions;
export type BuildOptions = Kloudless.fileExplorer.BuildOptions;
export type OAuthQueryParams = Kloudless.fileExplorer.OAuthQueryParams;
export type Events = Kloudless.fileExplorer.Events;
export type BaseMetadata = Kloudless.fileExplorer.BaseMetadata;
export type FileMetadata = Kloudless.fileExplorer.FileMetadata;
export type FolderMetadata = Kloudless.fileExplorer.FolderMetadata;
export type UserMetadata = Kloudless.fileExplorer.UserMetadata;
export type ParentMetadata = Kloudless.fileExplorer.ParentMetadata;
export type IdsMetadata = Kloudless.fileExplorer.IdsMetadata;
export type Error = Kloudless.fileExplorer.Error;
export type Account = Kloudless.fileExplorer.Account;
export type Task = Kloudless.fileExplorer.Task;
