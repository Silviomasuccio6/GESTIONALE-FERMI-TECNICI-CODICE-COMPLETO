import { parse as parseCsv } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { AppError } from "../../shared/errors/app-error.js";

export type ParsedImportRow = Record<string, string>;

export type ParsedImportFile = {
  headers: string[];
  rows: ParsedImportRow[];
};

export const normalizeImportHeader = (value: unknown): string => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const toCellString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const fromExcelValue = (value: ExcelJS.CellValue | undefined): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text.trim();
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText
        .map((part) => (typeof part.text === "string" ? part.text : ""))
        .join("")
        .trim();
    }
    if ("result" in value) {
      return toCellString(value.result);
    }
    if ("hyperlink" in value && typeof value.hyperlink === "string") {
      return value.hyperlink.trim();
    }
  }

  return String(value).trim();
};

const parseXlsxMatrix = async (buffer: Buffer): Promise<unknown[][]> => {
  const workbook = new ExcelJS.Workbook();
  await (workbook.xlsx as any).load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new AppError("File vuoto", 400, "IMPORT_FILE_EMPTY");
  }

  const matrix: unknown[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const values: string[] = [];
    const maxColumn = Math.max(row.cellCount, row.actualCellCount);
    for (let column = 1; column <= maxColumn; column += 1) {
      values.push(fromExcelValue(row.getCell(column).value));
    }
    matrix.push(values);
  });

  return matrix;
};

const parseCsvMatrix = (buffer: Buffer): unknown[][] => {
  const text = buffer.toString("utf8");
  return parseCsv(text, {
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true
  }) as unknown[][];
};

const parseMatrix = async (buffer: Buffer): Promise<unknown[][]> => {
  try {
    return await parseXlsxMatrix(buffer);
  } catch {
    try {
      return parseCsvMatrix(buffer);
    } catch {
      throw new AppError("File non valido o corrotto", 400, "IMPORT_FILE_INVALID");
    }
  }
};

export const parseImportFile = async (buffer: Buffer): Promise<ParsedImportFile> => {
  const matrix = await parseMatrix(buffer);

  if (!matrix.length) {
    throw new AppError("File vuoto", 400, "IMPORT_FILE_EMPTY");
  }

  const headerRow = matrix[0] ?? [];
  const headers = headerRow.map((item) => normalizeImportHeader(item)).filter(Boolean);
  if (!headers.length) {
    throw new AppError("Intestazioni mancanti nel file", 400, "IMPORT_HEADERS_MISSING");
  }

  const rows: ParsedImportRow[] = [];
  for (let index = 1; index < matrix.length; index += 1) {
    const rowArray = matrix[index] ?? [];
    const rowObj: ParsedImportRow = {};
    let hasValue = false;

    for (let cellIndex = 0; cellIndex < headers.length; cellIndex += 1) {
      const header = headers[cellIndex];
      if (!header) continue;
      const value = toCellString(rowArray[cellIndex]);
      rowObj[header] = value;
      if (value) hasValue = true;
    }

    if (hasValue) rows.push(rowObj);
  }

  return { headers, rows };
};
