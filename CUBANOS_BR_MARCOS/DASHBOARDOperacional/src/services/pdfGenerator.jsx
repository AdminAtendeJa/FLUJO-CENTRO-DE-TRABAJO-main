import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Opcional: Registrar fuentes si se necesita (ej. Roboto)
// Font.register({ family: 'Roboto', src: '...' });

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.5,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    textTransform: 'uppercase',
  },
  text: {
    marginBottom: 20,
    textAlign: 'justify',
  },
  textCenter: {
    textAlign: 'center',
    marginBottom: 20,
  },
  signatureContainer: {
    marginTop: 60,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  signatureLine: {
    width: 300,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 10,
    textAlign: 'center',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  }
});

// Función auxiliar para obtener fecha actual formateada
function getCurrentDateFormatted(city = "SOROCABA/SP") {
  const date = new Date();
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  // Formato: YYYY-MM-DD
  const formatted = date.toISOString().split('T')[0];
  return `${city}, ${formatted}`;
}

// -------------------------------------------------------------
// PLANTILLAS DE COMPONENTES PDF
// -------------------------------------------------------------

const ProcuracaoRetirarDocumentosDoc = ({ cliente }) => {
  const nombre = cliente.nombre || '[NOMBRE_CLIENTE]';
  const nacionalidad = cliente.nacionalidad || 'cubana';
  const estadoCivil = cliente.estado_civil || '[ESTADO_CIVIL]';
  const profesion = cliente.profesion || '[PROFESION]';
  const rnm = cliente.rnm || '[RNM_CLIENTE]';
  const cpf = cliente.cpf || '[CPF_CLIENTE]';
  const direccion = cliente.direccion || '[DIRECCION_COMPLETA]';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>PROCURAÇÃO PARA RETIRAR DOCUMENTOS</Text>
        
        <Text style={styles.text}>
          Eu: <Text style={styles.bold}>{nombre.toUpperCase()}</Text>, nacionalidade: {nacionalidad}, estado civil: {estadoCivil}, profissão: {profesion}, portador(a) do RNM nº <Text style={styles.bold}>{rnm}</Text> (orgão expedidor: CGPI/DIREX/PF), e do CPF nº <Text style={styles.bold}>{cpf}</Text>, residente e domiciliada no endereço: {direccion}, pelo presente instrumento, nomeio e constituo meu bastante procurador(a):
        </Text>

        <Text style={styles.text}>
          <Text style={styles.bold}>Nome do(a) procurador:</Text> ___________________________________________________{'\n'}
          <Text style={styles.bold}>CPF:</Text> _________________________ <Text style={styles.bold}>RG ou RNM:</Text> _________________________{'\n'}
          <Text style={styles.bold}>Endereço:</Text> ______________________________________________________________
        </Text>

        <Text style={styles.text}>
          para, em meu nome e me representando, praticar os seguintes atos perante a <Text style={styles.bold}>Polícia Federal</Text> e quaisquer repartições públicas ou privadas relacionadas ao assunto:
        </Text>

        <Text style={styles.text}>
          1. Retirar o Registro Nacional Migratório (RNM)/ documento de identificação expedido pela Polícia Federal referente ao meu pedido/protocolo nº ___________________;{'\n\n'}
          2. Assinar recibos, termos, requerimentos e quaisquer documentos necessários para a retirada e recepção do referido RNM;{'\n\n'}
          3. Receber correio, comunicações, e retirar documentação relacionada ao processo acima referido;{'\n\n'}
          4. Praticar todos os demais atos necessários ao fiel cumprimento deste mandato.
        </Text>

        <Text style={styles.text}>
          A presente procuração é válida até o dia ___/___/______ Local e data:
        </Text>
        <Text style={styles.textCenter}>{getCurrentDateFormatted()}</Text>

        <View style={styles.signatureContainer}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>ASSINATURA</Text>
          <Text style={styles.signatureText}>{nombre.toUpperCase()}</Text>
        </View>
      </Page>
    </Document>
  );
};

const HipossuficienciaDoc = ({ cliente }) => {
  const nombre = cliente.nombre || '[NOMBRE_CLIENTE]';
  const documento = cliente.numero_pasaporte || cliente.cpf || '[DOCUMENTO_CLIENTE]';
  const tipoDoc = cliente.numero_pasaporte ? 'passaporte' : 'CPF';
  const email = cliente.email || '[EMAIL_CLIENTE]';
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>DECLARAÇÃO DE HIPOSSUFICIÊNCIA ECONÔMICA</Text>
        
        <Text style={styles.text}>
          Eu <Text style={styles.bold}>{nombre.toUpperCase()}</Text>, portador do documento nº <Text style={styles.bold}>{documento}</Text> (especificar tipo do documento: {tipoDoc}), endereço eletrônico: {email.toUpperCase()}, declaro, sob as penalidades da lei, para fins de aplicação da isenção prevista nos arts. 4º, inciso XII, 110, parágrafo único, e 113, § 3º, da Lei nº 13.445, de 2017, e 312 do Decreto nº 9.199, de 2017, que minha condição econômica se revela hipossuficiente para arcar com o pagamento dos valores das taxas cobradas para obtenção de documentos para regularização migratória e de multas aplicadas com base na legislação migratória brasileira.
        </Text>

        <Text style={styles.text}>
          A referida condição de hipossuficiência econômica justificase em razão de: ( ) não possuir trabalho remunerado; ( ) não possuir renda; (x) possuir perfil de renda familiar de até meio salário mínimo per capita ou renda familiar total de até 03 (três) salários mínimos; ( ) Outros(descrever)____________________________.
        </Text>

        <Text style={styles.text}>
          Por ser expressão da verdade, assino a presente DECLARAÇÃO, para os devidos fins de direito.
        </Text>

        <Text style={styles.textCenter}>{getCurrentDateFormatted()}</Text>

        <View style={styles.signatureContainer}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>{nombre.toUpperCase()}</Text>
        </View>
      </Page>
    </Document>
  );
};

const AntecedentesCriminaisDoc = ({ cliente }) => {
  const nombre = cliente.nombre || '[NOMBRE_CLIENTE]';
  const nac = cliente.nacionalidad || 'CUBA';
  const estadoCivil = cliente.estado_civil || 'SOLTEIRO(A)';
  const fechaNac = cliente.fecha_nacimiento ? new Date(cliente.fecha_nacimiento).toLocaleDateString('pt-BR') : '[DATA_NASC]';
  
  const madre = cliente.nombre_madre || '[NOMBRE_MADRE]';
  const padre = cliente.nombre_padre || '[NOMBRE_PADRE]';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>DECLARAÇÃO</Text>
        <Text style={{...styles.textCenter, marginBottom: 40}}>
          (A declaração deverá ser preenchida em letra de forma legível)
        </Text>
        
        <Text style={styles.text}>
          Eu <Text style={styles.bold}>{nombre.toUpperCase()}</Text> de nacionalidade {nac.toUpperCase()}, estado civil {estadoCivil.toUpperCase()} nascido aos {fechaNac}, na cidade [CIUDAD_ORIGEN], filho de {madre.toUpperCase()} e de {padre.toUpperCase()}.
        </Text>

        <Text style={styles.text}>
          <Text style={styles.bold}>DECLARO, SOB AS PENAS DA LEI, QUE NÃO RESPONDO E NEM RESPONDI A INQUÉRITO POLICIAL, NEM A PROCESSO CRIMINAL, NEM SOFRI CONDENAÇÃO JUDICIAL, NO BRASIL E NO EXTERIOR NOS ÚLTIMOS CINCO ANOS.</Text>
        </Text>

        <Text style={styles.text}>
          <Text style={styles.bold}>É considerado crime, com pena de reclusão e multa, omitir, em documento público ou particular, declaração que dele devia constar, ou nele inserir ou fazer inserir declaração falsa ou diversa da que devia ser escrita, com o fim de prejudicar direito, criar obrigação ou alterar a verdade sobre fato juridicamente relevante (Art. 299, do Código Penal).</Text>
        </Text>

        <Text style={styles.textCenter}>{getCurrentDateFormatted()}</Text>

        <View style={styles.signatureContainer}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>{nombre.toUpperCase()}</Text>
        </View>
      </Page>
    </Document>
  );
};

// -------------------------------------------------------------
// FUNCIÓN PRINCIPAL PARA GENERAR EL ARCHIVO PDF
// -------------------------------------------------------------
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
