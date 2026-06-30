CREATE OR REPLACE FUNCTION trg_insert_document_from_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.media_url IS NOT NULL THEN
    INSERT INTO documentos_operacionales (
      id_cliente, 
      tipo_documento, 
      nombre_archivo, 
      url_archivo, 
      tamaño_bytes, 
      tipo_contenido, 
      subido_por, 
      estado
    ) VALUES (
      NEW.cliente_id,
      CASE
        WHEN NEW.media_type LIKE 'image/%' THEN 'FOTO'
        WHEN NEW.media_type LIKE 'video/%' THEN 'VIDEO'
        WHEN NEW.media_type LIKE 'audio/%' THEN 'AUDIO'
        ELSE 'OTRO'
      END,
      COALESCE(NEW.media_name, 'Archivo de WhatsApp'),
      NEW.media_url,
      0,
      COALESCE(NEW.media_type, 'application/octet-stream'),
      'WhatsApp',
      'pendiente'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_whatsapp_media_insert ON notas_kommo;

CREATE TRIGGER after_whatsapp_media_insert
AFTER INSERT ON notas_kommo
FOR EACH ROW
EXECUTE FUNCTION trg_insert_document_from_whatsapp();
