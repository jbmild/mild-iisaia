-- Tablas que Altium lee por ODBC. Los nombres coinciden con el Excel
-- para que el DbLib mapee Library Ref, Footprint Ref y Description solo.
-- Part Number es la clave de búsqueda. No hay columnas de aplicación:
-- Altium convierte cada columna en un parámetro o en un modelo.

CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE app.part_number (
    part_number text PRIMARY KEY,
    table_name text NOT NULL
);

CREATE FUNCTION app.enforce_part_number() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO app.part_number (part_number, table_name)
        VALUES (NEW."Part Number", TG_TABLE_NAME);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW."Part Number" IS DISTINCT FROM OLD."Part Number" THEN
            UPDATE app.part_number
            SET part_number = NEW."Part Number"
            WHERE part_number = OLD."Part Number"
              AND table_name = TG_TABLE_NAME;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM app.part_number
        WHERE part_number = OLD."Part Number"
          AND table_name = TG_TABLE_NAME;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TABLE "CAPACITOR" (
    "Part Number" text PRIMARY KEY,
    "Manufacturer" text,
    "Series" text,
    "Manufacturer PN" text,
    "Value" text,
    "Type" text,
    "Package Imperial" text,
    "Package Metric" text,
    "Case" text,
    "ESR" text,
    "Voltage" text,
    "Tolerance" text,
    "Temp Range" text,
    "Temp Coef" text,
    "Failure Rate" text,
    "Features" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text,
    "Description" text
);

CREATE TRIGGER "CAPACITOR_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "CAPACITOR"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();

CREATE TABLE "INDUCTOR" (
    "Part Number" text PRIMARY KEY,
    "Manufacturer" text,
    "Series" text,
    "Manufacturer PN" text,
    "Value" text,
    "Package Imperial" text,
    "Package Metric" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text,
    "Description" text
);

CREATE TRIGGER "INDUCTOR_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "INDUCTOR"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();

CREATE TABLE "FERRITE" (
    "Part Number" text PRIMARY KEY,
    "Manufacturer" text,
    "Series" text,
    "Manufacturer PN" text,
    "Package" text,
    "Lines" text,
    "Impedance" text,
    "Current" text,
    "Temp Range" text,
    "DC Resistance" text,
    "Features" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text,
    "Description" text
);

CREATE TRIGGER "FERRITE_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "FERRITE"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();

CREATE TABLE "RELAY" (
    "Part Number" text PRIMARY KEY,
    "Manufacturer" text,
    "Series" text,
    "Manufacturer PN" text,
    "Relay Type" text,
    "Coil Type" text,
    "Coil Current" text,
    "Coil Voltage" text,
    "Contact Form" text,
    "Contact Current" text,
    "Switching Voltage" text,
    "Turn On Voltage (Max)" text,
    "Turn Off Voltage (Min)" text,
    "Operate Time" text,
    "Release Time" text,
    "Mounting Type" text,
    "Termination Style" text,
    "Operating Temperature" text,
    "Coil Power" text,
    "Coil Resistance" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text,
    "Description" text
);

CREATE TRIGGER "RELAY_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "RELAY"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();

CREATE TABLE "SWITCH" (
    "Part Number" text PRIMARY KEY,
    "Manufacturer" text,
    "Series" text,
    "Manufacturer PN" text,
    "Package" text,
    "Circuit" text,
    "Current Rating" text,
    "Voltage" text,
    "Temp Range" text,
    "Features" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text,
    "Description" text
);

CREATE TRIGGER "SWITCH_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "SWITCH"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();

CREATE TABLE "DIODE" (
    "Part Number" text PRIMARY KEY,
    "Manufacturer" text,
    "Series" text,
    "Manufacturer PN" text,
    "Package" text,
    "Type" text,
    "Zener Voltage" text,
    "Power" text,
    "IF" text,
    "VR" text,
    "IR" text,
    "Temp Range" text,
    "Features" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text,
    "Description" text
);

CREATE TRIGGER "DIODE_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "DIODE"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();

CREATE TABLE "TVS" (
    "Part Number" text PRIMARY KEY,
    "Manufacturer" text,
    "Series" text,
    "Manufacturer PN" text,
    "Package" text,
    "Unidirectional Channels" text,
    "Bidirectional Channels" text,
    "Power - Peak Pulse" text,
    "Voltage Reverse Standoff" text,
    "Voltage Breakdown" text,
    "Voltage Clamping @ Ipp" text,
    "Current Peak Pulse" text,
    "Leakage Current" text,
    "Temp Range" text,
    "Features" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text,
    "Description" text,
    "Notes" text
);

CREATE TRIGGER "TVS_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "TVS"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();

CREATE TABLE "LED" (
    "Part Number" text PRIMARY KEY,
    "Manufacturer" text,
    "Series" text,
    "Manufacturer PN" text,
    "Package Imperial" text,
    "Package Metric" text,
    "Color" text,
    "VF" text,
    "IF" text,
    "Wavelength" text,
    "Candelas" text,
    "Failure Rate" text,
    "Features" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text,
    "Description" text
);

CREATE TRIGGER "LED_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "LED"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();

CREATE TABLE "OPTO" (
    "Part Number" text PRIMARY KEY,
    "Function" text,
    "Manufacturer" text,
    "Series" text,
    "Manufacturer PN" text,
    "Package" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text,
    "Description" text
);

CREATE TRIGGER "OPTO_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "OPTO"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();

CREATE TABLE "BJT" (
    "Part Number" text PRIMARY KEY,
    "Manufacturer" text,
    "Series" text,
    "Manufacturer PN" text,
    "Package" text,
    "Type" text,
    "Icmax" text,
    "VCEBmax" text,
    "VCEsat @ Ib, Ic" text,
    "ICB0" text,
    "HFEmin @ Ic, Vce" text,
    "Pmax" text,
    "BW" text,
    "Tjmax" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text,
    "Description" text
);

CREATE TRIGGER "BJT_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "BJT"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();

CREATE TABLE "MOSFET" (
    "Part Number" text PRIMARY KEY,
    "Manufacturer" text,
    "Series" text,
    "Manufacturer PN" text,
    "Package" text,
    "Type" text,
    "VDSS" text,
    "ID" text,
    "VGSth" text,
    "Temp Range" text,
    "Features" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text,
    "Description" text
);

CREATE TRIGGER "MOSFET_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "MOSFET"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();

CREATE TABLE "IC" (
    "Part Number" text PRIMARY KEY,
    "Function" text,
    "Manufacturer" text,
    "Series" text,
    "Manufacturer PN" text,
    "Package" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text,
    "Description" text
);

CREATE TRIGGER "IC_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "IC"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();

CREATE TABLE "MISC" (
    "Part Number" text PRIMARY KEY,
    "Key" text,
    "Description" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text
);

CREATE TRIGGER "MISC_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "MISC"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();

CREATE TABLE "RESISTOR" (
    "Part Number" text PRIMARY KEY,
    "Manufacturer" text,
    "Series" text,
    "Manufacturer PN" text,
    "Value" text,
    "Package Imperial" text,
    "Package Metric" text,
    "Composition" text,
    "Power" text,
    "Voltage" text,
    "Tolerance" text,
    "Temp Range" text,
    "Temp Coef" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text,
    "Description" text
);

CREATE TRIGGER "RESISTOR_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "RESISTOR"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();

CREATE TABLE "SSR" (
    "Part Number" text PRIMARY KEY,
    "Manufacturer" text,
    "Series" text,
    "Manufacturer PN" text,
    "Package" text,
    "Circuit" text,
    "Output Type" text,
    "Load Current" text,
    "Voltage – Input" text,
    "Voltage – Load" text,
    "On-State Resistance" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text,
    "Description" text
);

CREATE TRIGGER "SSR_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "SSR"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();

CREATE TABLE "XTAL" (
    "Part Number" text PRIMARY KEY,
    "Manufacturer" text,
    "Series" text,
    "Manufacturer PN" text,
    "Freq" text,
    "Package" text,
    "Freq Stability" text,
    "Freq Tolerance" text,
    "Load Capacitance" text,
    "ESR" text,
    "Temp Range" text,
    "Features" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text,
    "Description" text
);

CREATE TRIGGER "XTAL_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "XTAL"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();

CREATE TABLE "FUSE" (
    "Part Number" text PRIMARY KEY,
    "Manufacturer" text,
    "Series" text,
    "Manufacturer PN" text,
    "Fuse / Holder" text,
    "Type" text,
    "Current Rating" text,
    "Voltage Rating" text,
    "Response Time" text,
    "Package / Case" text,
    "Mounting Type" text,
    "Melting I2t" text,
    "Temperature" text,
    "Library Ref" text,
    "Library Path" text,
    "Footprint Ref" text,
    "Footprint Path" text,
    "Footprint Ref 2" text,
    "Footprint Path 2" text,
    "Footprint Ref 3" text,
    "Footprint Path 3" text,
    "Description" text
);

CREATE TRIGGER "FUSE_part_number"
AFTER INSERT OR UPDATE OR DELETE ON "FUSE"
FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();
