import { ProcuracaoRetirarDocumentosDoc } from './ProcuracaoRetirarDocumentosDoc';
import { HipossuficienciaDoc } from './HipossuficienciaDoc';
import { ProcuracaoMenoresDoc } from './ProcuracaoMenoresDoc';
import { DeclaracaoResidenciaChamanteDoc } from './DeclaracaoResidenciaChamanteDoc';
import { DeclaracaoEntradaBrasilDoc } from './DeclaracaoEntradaBrasilDoc';
import { DeclaracaoEletronicaDoc } from './DeclaracaoEletronicaDoc';
import { DeclaracaoSEIDoc } from './DeclaracaoSEIDoc';
import { DeclaracaoConjuntaDoc } from './DeclaracaoConjuntaDoc';
import { DeclaracaoCondicaoFiscalDoc } from './DeclaracaoCondicaoFiscalDoc';
import { DeclaracaoGeralMigranteDoc } from './DeclaracaoGeralMigranteDoc';
import { DeclaracaoMaisMedicosDoc } from './DeclaracaoMaisMedicosDoc';
import { DatosParaPoderDoc } from './DatosParaPoderDoc';
import { ServicioConsularDoc } from './ServicioConsularDoc';
import { InscripcionConsularDoc } from './InscripcionConsularDoc';
import { AntecedentesCriminaisDoc } from './AntecedentesCriminaisDoc';
import { pdf } from '@react-pdf/renderer';

export async function generateDocumentPDF(tipoDocumento, cliente, datosOperacionales, familiarLlamante = null) {
  let docElement = null;

  switch (tipoDocumento) {
    case 'HIPOSSUFICIENCIA':
      docElement = <HipossuficienciaDoc cliente={cliente} />;
      break;
    case 'ANTECEDENTES':
      docElement = <AntecedentesCriminaisDoc cliente={cliente} />;
      break;
    case 'PROCURACAO_RETIRAR_DOCS':
      docElement = <ProcuracaoRetirarDocumentosDoc cliente={cliente} />;
      break;
    case 'PROCURACAO_MENORES':
      docElement = <ProcuracaoMenoresDoc cliente={cliente} familiarLlamante={familiarLlamante} />;
      break;
    case 'DECLARACAO_RESIDENCIA_CHAMANTE':
      docElement = <DeclaracaoResidenciaChamanteDoc cliente={cliente} familiarLlamante={familiarLlamante} />;
      break;
    case 'DECLARACAO_ENTRADA_BRASIL':
      docElement = <DeclaracaoEntradaBrasilDoc cliente={cliente} />;
      break;
    case 'DECLARACAO_ELETRONICA':
      docElement = <DeclaracaoEletronicaDoc cliente={cliente} />;
      break;
    case 'DECLARACAO_SEI':
      docElement = <DeclaracaoSEIDoc cliente={cliente} />;
      break;
    case 'DECLARACAO_CONJUNTA':
      docElement = <DeclaracaoConjuntaDoc cliente={cliente} familiarLlamante={familiarLlamante} />;
      break;
    case 'DECLARACAO_CONDICAO_FISCAL':
      docElement = <DeclaracaoCondicaoFiscalDoc cliente={cliente} />;
      break;
    case 'DECLARACAO_GERAL_MIGRANTE':
      docElement = <DeclaracaoGeralMigranteDoc cliente={cliente} />;
      break;
    case 'DECLARACAO_MAIS_MEDICOS':
      docElement = <DeclaracaoMaisMedicosDoc cliente={cliente} />;
      break;
    case 'DATOS_PODER':
      docElement = <DatosParaPoderDoc cliente={cliente} />;
      break;
    case 'SERVICIO_CONSULAR':
      docElement = <ServicioConsularDoc cliente={cliente} />;
      break;
    case 'INSCRIPCION_CONSULAR':
      docElement = <InscripcionConsularDoc cliente={cliente} />;
      break;
    default:
      throw new Error(`Tipo de documento desconocido: ${tipoDocumento}`);
  }

  // Genera el blob del PDF
  const asPdf = pdf([]);
  asPdf.updateContainer(docElement);
  const blob = await asPdf.toBlob();
  
  // Descarga automática en navegador
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Documento_${tipoDocumento}_${cliente.nombre.replace(/\s+/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

