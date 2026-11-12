export interface IImportTemplateReader {
  read(): Promise<string>;
}
