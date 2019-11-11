export = fileExplorer;
export as namespace Kloudless;

declare namespace fileExplorer {

  function explorer(options: ExplorerOptions): Explorer;

  function dropzone(options: DropzoneOptions): Dropzone;

  function getGlobalOptions(): BuildOptions;

  function setGlobalOptions(buildOptions: BuildOptions);

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

  interface Dropzone extends Events {
    close(): void;
    destroy(): void;
    update(options: UpdateOptions): void;
  }

  type PersistMode = "none" | "local" | "session";
  type ServiceGroup = "file_store" | "object_store" | "construction" | "all";
  type ServiceName = string;
  type ChooserCategory = "all" | "folders" | "files" | "text" | "documents" | "images" | "videos" | "audio";
  type FileExtension = string;

  interface File {
    name: string;
    url: string;
  }

  interface LinkOptions {
    password?: string;
    expiration?: string;
    direct?: boolean;
  }

  interface ChooserAndSaverOptions {
    app_id: string;
    retrieve_token?: boolean;
    computer?: boolean;
    persist?: PersistMode;
    services?: (ServiceName | ServiceGroup)[];
    account_management?: boolean;
    display_backdrop?: boolean;
    custom_css?: string;
    locale?: string;
    translations?: string | object;
    dateTimeFormat?: string;
    create_folder?: boolean;
    /**
     * @deprecated
     */
    account_key?: boolean;
    /**
     * @deprecated
     */
    keys?: string[];
    tokens?: string[];
    enable_logout?: boolean;
    delete_accounts_on_logout?: boolean;

    oauth?(service: string): object;
  }

  interface ChooserOptions {
    multiselect?: boolean;
    link?: boolean;
    link_options?: LinkOptions;
    copy_to_upload_location?: "async" | "sync";
    upload_location_account?: string;
    upload_location_folder?: string;
    uploads_pause_on_error?: boolean;
    types?: (FileExtension | ChooserCategory)[];
  }

  interface SaverOptions {
    files?: File[];
  }

  type ExplorerOptions = ChooserAndSaverOptions & ChooserOptions & SaverOptions;

  type UpdateOptions = Omit<ExplorerOptions, "app_id" | "custom_css" | "types" | "services" | "persist" | "create_folder" | "account_key">;

  interface DropzoneOptions extends ExplorerOptions {
    elementId: string;
  }

  interface BuildOptions {
    explorerUrl?: string;
  }

  interface Events {
    on(event: "success", callback: (files: FileMetadata[]) => void): void;
    on(event: "cancel", callback: () => void): void;
    on(event: "error", callback: (files: FileErrorMetadata[]) => void): void;
    on(event: "open", callback: () => void): void;
    on(event: "close", callback: () => void): void;
    on(event: "selected", callback: (files: FileMetadata[]) => void): void;
    on(event: "addAccount", callback: (account: Account) => void): void;
    on(event: "deleteAccount", callback: (account: Account) => void): void;
    on(event: "startFileUpload", callback: (file: ChooserUploadFile | SaverUploadFile) => void): void;
    on(event: "finishFileUpload", callback: (file: ChooserFinishedUploadFile | SaverFinishedUploadFile) => void): void;
    on(event: "logout", callback: () => void): void;
    on(event: "drop", callback: () => void): void;
  }

  interface FileMetadata {
    id: string;
    name: string;
    size: number | null;
    created: string | null;
    modified: string | null;
    type: "file";
    account: number;
    parent: ParentMetadata;
    ancestors: ParentMetadata[] | null;
    path: string | null;
    mime_type: string;
    downloadable: boolean;
    /**
     * @deprecated Use `raw` below instead, which contains an `id` attribute.
     */
    raw_id: string;
    raw: {
      id: string;
      object: object;
    }
    owner?: UserMetadata;
    creator?: UserMetadata;
    last_modifier?: UserMetadata;
    api: "storage";
    ids?: IdsMetadata;
    id_type?: keyof IdsMetadata;

    /**
     * Present when `retrieve_token: true` configuration option is used.
     */
    bearer_token?: {
      key: string;
    };
  }

  interface UserMetadata {
    id: string;
  }

  interface ParentMetadata {
    id: string;
    name: string;
    id_type?: string;
  }

  interface IdsMetadata {
    default: string;
    shared: string;
    path: string;
    version: string;
  }

  interface FileErrorMetadata extends FileMetadata {
    error: FileError;
  }

  interface FileError {
    status_code: number;
    message: string;
    error_code: string;
    id: string;
  }

  interface Account {
    id: string;
    name: string;
    service: string;
  }

  interface ChooserUploadFile {
    id: string;
    name: string;
    size: number;
    mime_type: string;
  }

  interface SaverUploadFile {
    url: string;
    name: string;
  }

  interface ChooserFinishedUploadFile extends ChooserUploadFile {
    metadata: FileMetadata;
  }

  interface SaverFinishedUploadFile extends SaverUploadFile {
    metadata: FileMetadata;
  }
}