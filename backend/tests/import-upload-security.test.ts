import assert from "node:assert/strict";
import test from "node:test";
import { assertImportFileIntegrity } from "../src/infrastructure/storage/import-upload.js";

test("accepts xlsx file with zip signature", () => {
  const file = {
    originalname: "veicoli.xlsx",
    buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00])
  } as Express.Multer.File;

  assert.doesNotThrow(() => assertImportFileIntegrity(file));
});

test("rejects xlsx file when binary signature is invalid", () => {
  const file = {
    originalname: "veicoli.xlsx",
    buffer: Buffer.from("not-a-real-xlsx", "utf8")
  } as Express.Multer.File;

  assert.throws(() => assertImportFileIntegrity(file), (error: any) => {
    assert.equal(error.code, "IMPORT_FILE_CONTENT_INVALID");
    return true;
  });
});

test("accepts csv file with text content", () => {
  const file = {
    originalname: "veicoli.csv",
    buffer: Buffer.from("targa,marca,modello\nAB123CD,Iveco,Daily\n", "utf8")
  } as Express.Multer.File;

  assert.doesNotThrow(() => assertImportFileIntegrity(file));
});

test("rejects csv file with binary payload", () => {
  const file = {
    originalname: "veicoli.csv",
    buffer: Buffer.from([0x00, 0xff, 0x10, 0x88, 0x00, 0x01])
  } as Express.Multer.File;

  assert.throws(() => assertImportFileIntegrity(file), (error: any) => {
    assert.equal(error.code, "IMPORT_FILE_CONTENT_INVALID");
    return true;
  });
});
