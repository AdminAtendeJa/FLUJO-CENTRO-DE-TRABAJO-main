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

const ProcuracaoMenoresDoc = ({ cliente, familiarLlamante }) => {
  const nombre = cliente.nombre || '[NOMBRE_CLIENTE]';
  const cpf = cliente.cpf || '[CPF_CLIENTE]';
  const rnm = cliente.rnm || '[RNM_CLIENTE]';
  const estadoCivil = cliente.estado_civil || '[ESTADO_CIVIL]';
  const profesion = cliente.profesion || '[PROFISSAO]';
  
  const nombreHijo = familiarLlamante?.nombre || '[NOME_MENOR]';
  const rnmHijo = familiarLlamante?.rnm || '[RNM_MENOR]';
  const cpfHijo = familiarLlamante?.cpf || '[CPF_MENOR]';
  const direccion = cliente.direccion || '[ENDERECO_COMPLETO]';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>PROCURAÇÃO PARA RETIRAR DOCUMENTOS PARA MENORES DE IDADE</Text>
        <Text style={styles.text}>
          Eu <Text style={styles.bold}>{nombre.toUpperCase()}</Text>, cubana(o), com RNM: <Text style={styles.bold}>{rnm}</Text> e CPF <Text style={styles.bold}>{cpf}</Text>, estado civil: {estadoCivil}, ocupação: {profesion} declaro que sou mãe/pai e representante legal do menor <Text style={styles.bold}>{nombreHijo.toUpperCase()}</Text> com RNM {rnmHijo} e CPF {cpfHijo} Todos com residencia em {direccion}.
        </Text>
        <Text style={styles.text}>pelo presente instrumento, nomeio e constituo meu bastante procurador(a):</Text>
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

const DeclaracaoResidenciaChamanteDoc = ({ cliente, familiarLlamante }) => {
  const nombre = familiarLlamante?.nombre || '[NOMBRE_CHAMANTE]';
  const cpf = familiarLlamante?.cpf || '[CPF_CHAMANTE]';
  const nombreLlamado = cliente.nombre || '[NOME_CHAMADO]';
  const fechaNacLlamado = cliente.fecha_nacimiento ? new Date(cliente.fecha_nacimiento).toLocaleDateString('pt-BR') : '[DATA_NASC_CHAMADO]';
  const nacLlamado = cliente.nacionalidad || 'CUBA';
  const estadoCivilLlamado = cliente.estado_civil || '[ESTADO_CIVIL_CHAMADO]';
  
  const madreLlamado = cliente.nombre_madre || '[NOME_MADRE]';
  const padreLlamado = cliente.nombre_padre || '[NOME_PADRE]';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>DECLARAÇÃO</Text>
        <Text style={{...styles.textCenter, marginBottom: 40}}>(A declaração deverá ser preenchida em letra de forma legível)</Text>
        
        <Text style={styles.text}>
          Eu <Text style={styles.bold}>{nombreLlamado.toUpperCase()}</Text> de nacionalidade {nacLlamado.toUpperCase()}, estado civil {estadoCivilLlamado.toUpperCase()} nascido aos {fechaNacLlamado}, na cidade [CIUDAD_ORIGEN], filho de {madreLlamado.toUpperCase()} e de {padreLlamado.toUpperCase()}.
        </Text>
        
        <Text style={styles.text}>
          <Text style={styles.bold}>DECLARO, SOB AS PENAS DA LEI, QUE O FAMILIAR CHAMANTE</Text> <Text style={styles.bold}>{nombre.toUpperCase()}</Text> data de nascimento [DATA_NASC_CHAMANTE], portador(a) do documento de identificação [DOC_CHAMANTE] - CPF: {cpf}, reside no Brasil no endereço [ENDERECO_CHAMANTE] e telefone [TELEFONE_CHAMANTE].
        </Text>
        
        <Text style={styles.text}>
          <Text style={styles.bold}>É considerado crime, com pena de reclusão e multa, omitir, em documento público ou particular, declaração que dele devia constar, ou nele inserir ou fazer inserir declaração falsa ou diversa da que devia ser escrita, com o fim de prejudicar direito, criar obrigação ou alterar a verdade sobre fato juridicamente relevante (Art. 299, do Código Penal).</Text>
        </Text>
        <Text style={styles.textCenter}>{getCurrentDateFormatted()}</Text>
        <View style={styles.signatureContainer}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>{nombreLlamado.toUpperCase()}</Text>
        </View>
      </Page>
    </Document>
  );
};

const DeclaracaoEntradaBrasilDoc = ({ cliente }) => {
  const nombre = cliente.nombre || '[NOME_CLIENTE]';
  const documento = cliente.numero_pasaporte || cliente.cpf || '[DOC_CLIENTE]';
  const tipoDoc = cliente.numero_pasaporte ? 'passaporte' : 'CPF';
  const fechaEntrada = cliente.fecha_entrada_brasil ? new Date(cliente.fecha_entrada_brasil).toLocaleDateString('pt-BR') : '[DATA_ENTRADA]';
  const lugarEntrada = cliente.lugar_entrada_brasil || '[LUGAR_ENTRADA]';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>DECLARAÇÃO DE ENTRADA AO BRASIL</Text>
        <Text style={{...styles.textCenter, marginBottom: 40}}>(A declaração deverá ser preenchida em letra de forma legível)</Text>
        
        <Text style={styles.text}>
          Eu, <Text style={styles.bold}>{nombre.toUpperCase()}</Text> natural de CUBA, portador do documento {documento} - {tipoDoc}, declaro, para fins de AUTORIZAÇÃO DE RESIDÊNCIA, que ingressei em território brasileiro na data de {fechaEntrada}, através da fronteira/cidade de {lugarEntrada.toUpperCase()}, respondendo a qualquer tempo pela informação prestada, conforme disposto no art. 71, do Decreto 9.199/2017.
        </Text>
        
        <Text style={styles.text}>Atenciosamente,</Text>
        <Text style={styles.textCenter}>{getCurrentDateFormatted()}</Text>
        <View style={styles.signatureContainer}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>{nombre.toUpperCase()}</Text>
        </View>
      </Page>
    </Document>
  );
};

const DeclaracaoEletronicaDoc = ({ cliente }) => {
  const nombre = cliente.nombre || '[NOME_CLIENTE]';
  const cpf = cliente.cpf || '[CPF]';
  const documento = cliente.numero_pasaporte || '[PASAPORTE]';
  const email = cliente.email || '[EMAIL]';
  const telefono = cliente.telefono || '[TELEFONE]';
  const direccion = cliente.direccion || '[ENDERECO]';
  const fechaNac = cliente.fecha_nacimiento ? new Date(cliente.fecha_nacimiento).toLocaleDateString('pt-BR') : '[DATA_NASC]';
  const madre = cliente.nombre_madre || '[NOME_MADRE]';
  const padre = cliente.nombre_padre || '[NOME_PADRE]';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>DECLARAÇÃO ELETRÔNICA E DEMAIS MEIOS DE CONTATO</Text>
        <Text style={{...styles.textCenter, marginBottom: 20}}>(O formulário deverá ser preenchido em letra de forma legível)</Text>
        
        <View style={{ border: '1px solid #000', marginBottom: 20 }}>
          <View style={{ borderBottom: '1px solid #000', padding: 5, backgroundColor: '#f0f0f0' }}>
            <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>IDENTIFICAÇÃO</Text>
          </View>
          <View style={{ borderBottom: '1px solid #000', padding: 5, flexDirection: 'row' }}>
            <Text style={{ width: '30%' }}>Nome completo</Text><Text style={{ width: '70%', fontWeight: 'bold' }}>{nombre.toUpperCase()}</Text>
          </View>
          <View style={{ borderBottom: '1px solid #000', padding: 5, flexDirection: 'row' }}>
            <Text style={{ width: '30%' }}>Filiação 1</Text><Text style={{ width: '70%' }}>{madre.toUpperCase()}</Text>
          </View>
          <View style={{ borderBottom: '1px solid #000', padding: 5, flexDirection: 'row' }}>
            <Text style={{ width: '30%' }}>Filiação 2</Text><Text style={{ width: '70%' }}>{padre.toUpperCase()}</Text>
          </View>
          <View style={{ borderBottom: '1px solid #000', padding: 5, flexDirection: 'row' }}>
            <Text style={{ width: '30%' }}>CPF</Text><Text style={{ width: '70%' }}>{cpf}</Text>
          </View>
          <View style={{ borderBottom: '1px solid #000', padding: 5, flexDirection: 'row' }}>
            <Text style={{ width: '30%' }}>Data de nascimento</Text><Text style={{ width: '70%' }}>{fechaNac}</Text>
          </View>
          <View style={{ borderBottom: '1px solid #000', padding: 5, flexDirection: 'row' }}>
            <Text style={{ width: '30%' }}>Documento de identidade</Text><Text style={{ width: '70%' }}>{documento} - Passaporte</Text>
          </View>
          <View style={{ borderBottom: '1px solid #000', padding: 5, flexDirection: 'row' }}>
            <Text style={{ width: '30%' }}>Nacionalidade</Text><Text style={{ width: '70%' }}>CUBA</Text>
          </View>
          
          <View style={{ borderBottom: '1px solid #000', padding: 5, backgroundColor: '#f0f0f0' }}>
            <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>DADOS DO CONTATO</Text>
          </View>
          <View style={{ borderBottom: '1px solid #000', padding: 5, flexDirection: 'row' }}>
            <Text style={{ width: '30%' }}>Telefones</Text><Text style={{ width: '70%' }}>{telefono}</Text>
          </View>
          <View style={{ borderBottom: '1px solid #000', padding: 5, flexDirection: 'row' }}>
            <Text style={{ width: '30%' }}>Endereço eletrônico (E-mail)</Text><Text style={{ width: '70%' }}>{email.toUpperCase()}</Text>
          </View>
          <View style={{ borderBottom: '1px solid #000', padding: 5, flexDirection: 'row' }}>
            <Text style={{ width: '30%' }}>Endereço residencial</Text><Text style={{ width: '70%' }}>{direccion.toUpperCase()}</Text>
          </View>
          <View style={{ padding: 5, flexDirection: 'row' }}>
            <Text style={{ width: '30%' }}>Endereço do trabalho</Text><Text style={{ width: '70%' }}>[NÃO DECLARADO]</Text>
          </View>
        </View>

        <Text style={{ fontSize: 10, marginBottom: 10, textAlign: 'justify' }}>
          Declaro sob as penas da legislação brasileira, que as informações por mim emitidas para as finalidades da Lei nº 13.445, de 2017 e do Decreto nº 9.199, de 2017 são verídicas, estando ciente do dever de atualização cadastral perante a Polícia Federal sempre que houver alteração de dados pessoais e meios de contato.
        </Text>
        <Text style={{ fontSize: 10, marginBottom: 10, textAlign: 'justify' }}>
          Declaro ainda que estou ciente que eventuais comunicações e notificações em procedimentos administrativos perante a Polícia Federal serão encaminhadas preferencialmente para o endereço eletrônico (e-mail) acima informado e publicadas no sítio oficial da Polícia Federal na internet: https://www.gov.br/pf/pt-br/assuntos/imigracao, e que o início da contagem de prazo para manifestação, nos termos desta Portaria, se dará com a publicação no sítio oficial da Polícia Federal na internet.
        </Text>
        <Text style={{ fontSize: 10, marginBottom: 20, textAlign: 'justify' }}>
          <Text style={styles.bold}>É considerado crime, com pena de reclusão e multa, omitir, em documento público ou particular, declaração que dele devia constar, ou nele inserir ou fazer inserir declaração falsa ou diversa da que devia ser escrita, com o fim de prejudicar direito, criar obrigação ou alterar a verdade sobre fato juridicamente relevante (Art. 299, do Código Penal).</Text>
        </Text>
        
        <Text style={styles.textCenter}>{getCurrentDateFormatted()}</Text>
        <View style={{ marginTop: 40, display: 'flex', alignItems: 'center' }}>
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
