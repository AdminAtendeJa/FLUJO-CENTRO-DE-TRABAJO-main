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

const DeclaracaoSEIDoc = ({ cliente }) => {
  const nombre = cliente.nombre || '[NOME_CLIENTE]';
  const cpf = cliente.cpf || '[CPF]';
  const email = cliente.email || '[EMAIL]';
  const telefono = cliente.telefono || '[TELEFONE]';
  const direccion = cliente.direccion || '[ENDERECO]';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 10 }}>Ministério da Justiça e Segurança Pública</Text>
        <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 10, marginBottom: 10 }}>
          TERMO DE DECLARAÇÃO DE CONCORDÂNCIA E VERACIDADE{'\n'}
          CADASTRO DE USUÁRIO EXTERNO NO SISTEMA ELETRÔNICO DE INFORMAÇÕES – SEI
        </Text>
        
        <View style={{ border: '1px solid #000', marginBottom: 10, fontSize: 10 }}>
          <View style={{ borderBottom: '1px solid #000', padding: 5, flexDirection: 'row' }}>
            <Text style={{ width: '30%', fontWeight: 'bold' }}>Nome Completo:</Text><Text style={{ width: '70%' }}>{nombre.toUpperCase()}</Text>
          </View>
          <View style={{ borderBottom: '1px solid #000', padding: 5, flexDirection: 'row' }}>
            <Text style={{ width: '30%', fontWeight: 'bold' }}>Nº do CPF:</Text><Text style={{ width: '70%' }}>{cpf}</Text>
          </View>
          <View style={{ borderBottom: '1px solid #000', padding: 5, flexDirection: 'row' }}>
            <Text style={{ width: '30%', fontWeight: 'bold' }}>E-mail de uso pessoal:</Text><Text style={{ width: '70%' }}>{email.toUpperCase()}</Text>
          </View>
          <View style={{ borderBottom: '1px solid #000', padding: 5, flexDirection: 'row' }}>
            <Text style={{ width: '30%', fontWeight: 'bold' }}>Telefone(s):</Text><Text style={{ width: '70%' }}>{telefono}</Text>
          </View>
          <View style={{ padding: 5, flexDirection: 'row' }}>
            <Text style={{ width: '30%', fontWeight: 'bold' }}>Endereço Residencial:</Text><Text style={{ width: '70%' }}>{direccion.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 8, marginBottom: 5 }}>DECLARO que são de minha exclusiva responsabilidade:</Text>
        <Text style={{ fontSize: 8, textAlign: 'justify', marginBottom: 5 }}>
          I - o sigilo da senha de acesso ao Sistema Eletrônico de Informações - SEI, não sendo cabível, em hipótese alguma, a alegação de uso indevido;{'\n'}
          II - a conformidade entre os dados informados no formulário eletrônico de peticionamento e os constantes do documento protocolizado...
        </Text>
        <Text style={{ fontSize: 8, textAlign: 'justify', marginBottom: 10 }}>
          * A realização do cadastro como usuário externo no SEI do Ministério da Justiça e Segurança Pública e a entrega deste documento implicará na aceitação de todos os termos e condições que regem o processo eletrônico, conforme previsto no Decreto nº 8.539, de 8 de outubro de 2015.
        </Text>
        
        <Text style={{ fontSize: 10, textAlign: 'center', marginTop: 20, marginBottom: 30 }}>
          ______________________, _________ de ___________________________ de ________________
        </Text>
        <View style={{ display: 'flex', alignItems: 'center' }}>
          <View style={styles.signatureLine} />
          <Text style={{ fontSize: 10 }}>Assinatura do Usuário</Text>
          <Text style={{ fontSize: 8 }}>(conforme assinatura do documento de identidade apresentado)</Text>
        </View>
      </Page>
    </Document>
  );
};

const DeclaracaoConjuntaDoc = ({ cliente, familiarLlamante }) => {
  const nombreLlamado = cliente.nombre || '[NOME_CHAMADO]';
  const nacLlamado = cliente.nacionalidad || 'CUBANA';
  const fechaNacLlamado = cliente.fecha_nacimiento ? new Date(cliente.fecha_nacimiento).toLocaleDateString('pt-BR') : '[DATA_NASC_CHAMADO]';
  
  const nombreLlamante = familiarLlamante?.nombre || '[NOME_CHAMANTE]';
  const nacLlamante = familiarLlamante?.nacionalidade || 'BRASILEIRO(A)';
  const fechaNacLlamante = familiarLlamante?.fecha_nacimiento || '[DATA_NASC_CHAMANTE]';
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>DECLARAÇÃO CONJUNTA</Text>
        <Text style={{...styles.textCenter, marginBottom: 30}}>(A declaração deverá ser preenchida em letra de forma legível)</Text>
        
        <Text style={{...styles.text, lineHeight: 2}}>
          EU (chamado), <Text style={styles.bold}>{nombreLlamado.toUpperCase()}</Text>, de nacionalidade {nacLlamado.toUpperCase()}, estado civil CASADO(A), nascido(a) aos {fechaNacLlamado}, na cidade de [CIDADE], filho de [PAIS_CHAMADO],{'\n'}
          e EU (chamante), <Text style={styles.bold}>{nombreLlamante.toUpperCase()}</Text>, de nacionalidade {nacLlamante.toUpperCase()}, estado civil CASADO(A), nascido(a) aos {fechaNacLlamante}, na cidade de [CIDADE], filho de [PAIS_CHAMANTE],
        </Text>
        
        <Text style={{...styles.text, marginTop: 10}}>
          <Text style={styles.bold}>DECLARAMOS, SOB AS PENAS DA LEI, QUE SOMOS CASADOS OU CONVIVEMOS EM UNIÃO ESTÁVEL, EM UMA EFETIVA UNIÃO E CONVIVÊNCIA DESDE [DATA_UNIAO].</Text>
        </Text>
        
        <Text style={{...styles.text, marginTop: 10}}>
          <Text style={styles.bold}>É considerado crime, com pena de reclusão e multa, omitir, em documento público ou particular, declaração que dele devia constar, ou nele inserir ou fazer inserir declaração falsa ou diversa da que devia ser escrita, com o fim de prejudicar direito, criar obrigação ou alterar a verdade sobre fato juridicamente relevante (Art. 299, do Código Penal).</Text>
        </Text>
        
        <Text style={{...styles.textCenter, marginTop: 30}}>{getCurrentDateFormatted()}</Text>
        
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: 50 }}>
          <View style={{ display: 'flex', alignItems: 'center', width: '45%' }}>
            <View style={{ width: '100%', borderBottomWidth: 1 }} />
            <Text style={{ fontSize: 10, marginTop: 5 }}>Assinatura do(a) Chamado</Text>
          </View>
          <View style={{ display: 'flex', alignItems: 'center', width: '45%' }}>
            <View style={{ width: '100%', borderBottomWidth: 1 }} />
            <Text style={{ fontSize: 10, marginTop: 5 }}>Assinatura do(a) Chamante</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const DeclaracaoCondicaoFiscalDoc = ({ cliente }) => {
  const nombre = cliente.nombre || '[NOME_CLIENTE]';
  const nac = cliente.nacionalidad || 'CUBANA';
  const fechaNac = cliente.fecha_nacimiento ? new Date(cliente.fecha_nacimiento).toLocaleDateString('pt-BR') : '[DATA_NASC]';
  const madre = cliente.nombre_madre || '[NOME_MADRE]';
  const padre = cliente.nombre_padre || '[NOME_PADRE]';
  const direccion = cliente.direccion || '[ENDERECO_COMPLETO]';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={{...styles.title, marginBottom: 10}}>Receita Federal</Text>
        <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 12, marginBottom: 30 }}>ANEXO ÚNICO{'\n'}DECLARAÇÃO DE CONDIÇÃO FISCAL</Text>
        
        <Text style={{...styles.text, lineHeight: 2}}>
          Eu, <Text style={styles.bold}>{nombre.toUpperCase()}</Text>, nascido(a) em {fechaNac}, de nacionalidade {nac.toUpperCase()}, filho de {padre.toUpperCase()} e de {madre.toUpperCase()},
        </Text>
        
        <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 14, marginVertical: 20 }}>DECLARO,</Text>
        
        <Text style={styles.text}>
          para fins de atos no Cadastro Nacional de Pessoas Físicas (CPF), sob as penas da lei, que resido no endereço:
        </Text>
        
        <View style={{ border: '1px solid #000', padding: 10, marginBottom: 20 }}>
          <Text>{direccion.toUpperCase()}</Text>
        </View>
        
        <Text style={styles.text}>e possuo a condição fiscal de:</Text>
        <Text style={styles.text}>( x ) residente no Brasil, nos termos do art. 2º da Instrução Normativa SRF nº 208/2002</Text>
        <Text style={styles.text}>(   ) não-residente no Brasil, nos termos do art. 3º da Instrução Normativa SRF nº 208/2002</Text>
        
        <Text style={{...styles.text, marginTop: 10}}>
          Declaro, ainda, que as informações aqui relatadas correspondem à expressão da verdade e que estou ciente da penalidade prevista no Código Penal quanto à falsidade ideológica.
        </Text>
        
        <View style={{ display: 'flex', flexDirection: 'row', border: '1px solid #000', marginTop: 30, height: 60 }}>
          <View style={{ flex: 1, borderRight: '1px solid #000', padding: 5 }}>
            <Text style={{ fontSize: 8 }}>Assinatura</Text>
          </View>
          <View style={{ flex: 1, padding: 5 }}>
            <Text style={{ fontSize: 8 }}>Local e Data</Text>
            <Text style={{ fontSize: 10, marginTop: 10, textAlign: 'center' }}>{getCurrentDateFormatted()}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const DeclaracaoGeralMigranteDoc = ({ cliente }) => {
  const nombre = cliente.nombre || '[NOME_CLIENTE]';
  const cpf = cliente.cpf || '[CPF]';
  const pasaporte = cliente.numero_pasaporte || '[PASAPORTE]';
  const nac = cliente.nacionalidad || 'CUBA';
  const fechaNac = cliente.fecha_nacimiento ? new Date(cliente.fecha_nacimiento).toLocaleDateString('pt-BR') : '[DATA_NASC]';
  const madre = cliente.nombre_madre || '[NOME_MADRE]';
  const padre = cliente.nombre_padre || '[NOME_PADRE]';
  const telefono = cliente.telefono || '[TELEFONE]';
  const email = cliente.email || '[EMAIL]';
  const direccion = cliente.direccion || '[ENDERECO_COMPLETO]';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 12, marginBottom: 5 }}>DECLARAÇÃO GERAL DO MIGRANTE</Text>
        <Text style={{ textAlign: 'center', fontSize: 8, marginBottom: 20 }}>(O FORMULÁRIO DEVERÁ SER PREENCHIDO EM LETRA DE FORMA LEGÍVEL)</Text>
        
        <Text style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 5 }}>1. IDENTIFICAÇÃO</Text>
        <View style={{ border: '1px solid #000', padding: 10, marginBottom: 15, fontSize: 10 }}>
          <Text>NOME: {nombre.toUpperCase()}</Text>
          <Text>FILIAÇÃO: {madre.toUpperCase()} (MÃE); e {padre.toUpperCase()} (PAI)</Text>
          <Text>CPF: {cpf} | DATA DE NASCIMENTO: {fechaNac}</Text>
          <Text>DOCUMENTO DE IDENTIDADE / PASSAPORTE: {pasaporte}</Text>
          <Text>NACIONALIDADE: {nac.toUpperCase()}</Text>
        </View>

        <Text style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 5 }}>2. DADOS DE CONTATO</Text>
        <View style={{ border: '1px solid #000', padding: 10, marginBottom: 15, fontSize: 10 }}>
          <Text>TELEFONE: {telefono} | E-MAIL: {email.toUpperCase()}</Text>
          <Text>ENDEREÇO RESIDENCIAL: {direccion.toUpperCase()}</Text>
        </View>

        <Text style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 5 }}>3. ANTECEDENTES - DECLARO, SOB AS PENAS DA LEI:</Text>
        <View style={{ border: '1px solid #000', padding: 10, marginBottom: 15, fontSize: 10 }}>
          <Text>( X ) QUE NÃO RESPONDO NEM RESPONDI INQUERITO POLICIAL, E NEM A PROCESSO CRIMINAL, NEM SOFRI CONDENAÇÃO JUDICIAL NO BRASIL E NO EXTERIOR NOS ÚLTIMOS CINCO ANOS.</Text>
          <Text style={{ marginTop: 5 }}>( X ) NÃO INCORRI EM NENHUMA DAS CAUSAS DE PERDA DE AUTORIZAÇÃO DE RESIDÊNCIA PREVISTAS NO ART. 135 DECRETO N°9.199 DE 2017.</Text>
        </View>

        <Text style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 5 }}>4. DO PAGAMENTO DE TAXAS E DECLARAÇÃO DE RENDA</Text>
        <View style={{ border: '1px solid #000', padding: 10, marginBottom: 15, fontSize: 10 }}>
          <Text>DECLARAÇÃO DE MEIOS DE VIDA: Declaro possuir meios de vida lícitos e suficientes para minha manutenção no Brasil.</Text>
          <Text style={{ marginTop: 5 }}>PAGAMENTO DE G.R.U: ( ) SIM ( X ) NÃO - Hipossuficiência.</Text>
        </View>
        
        <Text style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 5 }}>5. DECLARAÇÃO</Text>
        <View style={{ border: '1px solid #000', padding: 10, marginBottom: 20, fontSize: 8 }}>
          <Text>DECLARO, sob as penas da Legislação Brasileira, que as informações por mim emitidas são verídicas...</Text>
          <Text style={{ marginTop: 5 }}>DECLARO estar ciente que é considerado crime omitir ou falsear informações (art. 299 do Código Penal).</Text>
        </View>
        
        <Text style={styles.textCenter}>{getCurrentDateFormatted()}</Text>
        <View style={{ marginTop: 30, display: 'flex', alignItems: 'center' }}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>{nombre.toUpperCase()}</Text>
          <Text style={{ fontSize: 8 }}>ASSINATURA REQUERENTE DECLARANTE</Text>
        </View>
      </Page>
    </Document>
  );
};

const DeclaracaoMaisMedicosDoc = ({ cliente }) => {
  const nombre = cliente.nombre || '[NOME_CLIENTE]';
  const nac = cliente.nacionalidad || 'CUBANA';
  const fechaNac = cliente.fecha_nacimiento ? new Date(cliente.fecha_nacimiento).toLocaleDateString('pt-BR') : '[DATA_NASC]';
  const estadoCivil = cliente.estado_civil || '[ESTADO_CIVIL]';
  const madre = cliente.nombre_madre || '[NOME_MADRE]';
  const padre = cliente.nombre_padre || '[NOME_PADRE]';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>DECLARAÇÃO</Text>
        <Text style={{...styles.textCenter, marginBottom: 40}}>(A declaração deverá ser preenchida em letra de forma legível)</Text>
        
        <Text style={{...styles.text, lineHeight: 2}}>
          EU, <Text style={styles.bold}>{nombre.toUpperCase()}</Text>, de nacionalidade {nac.toUpperCase()}, estado civil {estadoCivil.toUpperCase()}, nascido(a) aos {fechaNac}, na cidade de [CIDADE_ORIGEM], filho de {padre.toUpperCase()} e de {madre.toUpperCase()},
        </Text>
        
        <Text style={{...styles.text, marginTop: 10}}>
          <Text style={styles.bold}>DECLARO, SOB AS PENAS DA LEI,</Text> QUE INTEGREI O PROGRAMA MAIS MÉDICOS PARA O BRASIL.
        </Text>
        
        <Text style={{...styles.text, marginTop: 20}}>
          <Text style={styles.bold}>É considerado crime, com pena de reclusão e multa, omitir, em documento público ou particular, declaração que dele devia constar, ou nele inserir ou fazer inserir declaração falsa ou diversa da que devia ser escrita, com o fim de prejudicar direito, criar obrigação ou alterar a verdade sobre fato juridicamente relevante (Art. 299, do Código Penal).</Text>
        </Text>
        
        <Text style={{...styles.textCenter, marginTop: 40}}>{getCurrentDateFormatted()}</Text>
        <View style={{ marginTop: 40, display: 'flex', alignItems: 'center' }}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>Assinatura do Declarante</Text>
        </View>
      </Page>
    </Document>
  );
};

const DatosParaPoderDoc = ({ cliente }) => {
  const nombre = cliente.nombre || '';
  const nac = cliente.nacionalidad || 'CUBANA';
  const fechaNac = cliente.fecha_nacimiento ? new Date(cliente.fecha_nacimiento).toLocaleDateString('pt-BR') : '';
  const identidad = cliente.cpf || '';
  const pasaporte = cliente.numero_pasaporte || '';
  const estadoCivil = cliente.estado_civil || '';
  const ocupacion = cliente.profesion || '';
  const madre = cliente.nombre_madre || '';
  const padre = cliente.nombre_padre || '';
  const direccionBrasil = cliente.direccion || '';

  const Field = ({ label, value, width = '100%' }) => (
    <View style={{ width, flexDirection: 'row', marginBottom: 5, alignItems: 'flex-end' }}>
      <Text style={{ fontSize: 9, marginRight: 5 }}>{label}</Text>
      <View style={{ flex: 1, borderBottom: '1px solid #000' }}>
        <Text style={{ fontSize: 10 }}>{value}</Text>
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={{...styles.page, padding: 30}}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 10, fontWeight: 'bold', fontStyle: 'italic' }}>Consulado General de Cuba</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', fontStyle: 'italic' }}>São Paulo</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>DATOS PARA SOLICITAR PODER</Text>
        </View>

        <Field label="PODER GENERAL" value="" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="PODER ESPECIAL PARA:" value="" width="60%" />
          <Field label="FECHA DE SOLICITUD:" value={getCurrentDateFormatted()} width="35%" />
        </View>

        <Text style={{ fontSize: 10, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>OTORGANTE:</Text>
        <Field label="NOMBRE Y APELLIDOS" value={nombre.toUpperCase()} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="LUGAR DE NACIMIENTO" value="" width="60%" />
          <Field label="CIUDADANÍA" value={nac.toUpperCase()} width="35%" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="FECHA DE NACIMIENTO" value={fechaNac} width="45%" />
          <View style={{ width: '50%' }}>
            <Field label="NO. IDENTIDAD" value={identidad} />
            <Field label="NO. PASAPORTE" value={pasaporte} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="LUGAR DE INCRIPCION DE NAC" value="" width="50%" />
          <Field label="TOMO" value="" width="20%" />
          <Field label="FOLIO" value="" width="20%" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="ESTADO CIVIL" value={estadoCivil.toUpperCase()} width="45%" />
          <Field label="OCUPACIÓN" value={ocupacion.toUpperCase()} width="50%" />
        </View>
        <Field label="HIJO DE" value={`${padre.toUpperCase()} Y ${madre.toUpperCase()}`} />
        <Field label="DIRECCIÓN PARTICULAR CUBA" value="" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="MUNICIPIO" value="" width="45%" />
          <Field label="PROVINCIA" value="" width="50%" />
        </View>
        <Field label="DIRECCIÓN PARTICULAR BRASIL" value={direccionBrasil.toUpperCase()} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="MUNICIPIO" value="" width="45%" />
          <Field label="ESTADO" value="" width="50%" />
        </View>

        <Text style={{ fontSize: 10, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>APODERADO:</Text>
        <Field label="NOMBRE Y APELLIDOS" value="" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="LUGAR DE NACIMIENTO" value="" width="60%" />
          <Field label="CIUDADANÍA" value="" width="35%" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="FECHA DE NACIMIENTO" value="" width="45%" />
          <Field label="OCUPACIÓN" value="" width="50%" />
        </View>
        <Field label="NO. DE DOCUMENTO DE IDENTIDAD O PASAPORTE" value="" />
        <Field label="ESTADO CIVIL" value="" />
        <Field label="HIJO DE" value="                                                   Y                                                    " />
        <Field label="DIRECCIÓN PARTICULAR" value="" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="MUNICIPIO" value="" width="45%" />
          <Field label="PROVINCIA" value="" width="50%" />
        </View>

        <Text style={{ fontSize: 10, marginTop: 10 }}>
          OTORGA PODER ESPECIAL A ESTA PERSONA PARA QUE LO REPRESENTE EN: Consulado de Brasil, Autoridades de imigracion, Policia Federal, Direccion de Identificacion y extranjeria de Cuba
        </Text>
        <Text style={{ fontSize: 9, fontWeight: 'bold', marginTop: 5, marginBottom: 5 }}>(SOLO PARA CASOS DE AUTORIZACION DE SALIDA DE MENOR, PARA MATRIMONIO O DIVORCIO)</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 'bold', marginTop: 5, marginBottom: 5 }}>DATOS DEL MENOR O DE LA PERSONA CON QUIEN SE VA A CASAR O DIVORCIAR:</Text>
        <Field label="NOMBRE Y APELLIDOS" value="" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="LUGAR DE NACIMIENTO" value="" width="60%" />
          <Field label="CIUDADANÍA" value="" width="35%" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="FECHA DE NACIMIENTO" value="" width="45%" />
          <View style={{ width: '50%' }}>
            <Field label="NO. IDENTIDAD" value="" />
            <Field label="NO. PASAPORTE" value="" />
          </View>
        </View>
      </Page>
    </Document>
  );
};

const ServicioConsularDoc = ({ cliente }) => {
  const nombre = cliente.nombre || '';
  const nombresArr = nombre.split(' ');
  const apellido1 = nombresArr.length > 1 ? nombresArr[nombresArr.length - 2] : '';
  const apellido2 = nombresArr.length > 1 ? nombresArr[nombresArr.length - 1] : '';
  const primerNombre = nombresArr.length > 2 ? nombresArr.slice(0, nombresArr.length - 2).join(' ') : nombresArr[0];
  
  const pasaporte = cliente.numero_pasaporte || '';
  const carnet = cliente.cpf || '';
  const sexo = cliente.sexo || ''; // M o F
  const estadoCivil = cliente.estado_civil || '';
  const madre = cliente.nombre_madre || '';
  const padre = cliente.nombre_padre || '';
  const direccion = cliente.direccion || '';
  const email = cliente.email || '';
  const telefono = cliente.telefono || '';
  const ocupacion = cliente.profesion || '';

  return (
    <Document>
      <Page size="A4" style={{...styles.page, padding: 20}}>
        <View style={{ border: '2px solid #000', padding: 5 }}>
          
          <View style={{ flexDirection: 'row', borderBottom: '1px solid #000', paddingBottom: 5 }}>
            <View style={{ width: '50%' }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold' }}>República de Cuba</Text>
              <Text style={{ fontSize: 12, fontWeight: 'bold', fontStyle: 'italic' }}>Ministerio del Interior</Text>
              <Text style={{ fontSize: 12, fontWeight: 'bold', fontStyle: 'italic' }}>Dirección de Inmigración y Extranjería</Text>
            </View>
            <View style={{ width: '50%' }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>SOLICITUD DE SERVICIO CONSULAR</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', fontSize: 8, marginTop: 5 }}>
                <Text style={{ width: '50%' }}>[ ] Pasaporte por primera vez</Text>
                <Text style={{ width: '50%' }}>[ ] Prórrogas</Text>
                <Text style={{ width: '50%' }}>[ X ] Renovación de Pasaporte</Text>
                <Text style={{ width: '50%' }}>[ ] Habilitación de Entrada</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', borderBottom: '1px solid #000', height: 120 }}>
            <View style={{ width: '25%', borderRight: '1px solid #000', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold' }}>FOTO PEGADA</Text>
              <Text style={{ fontSize: 10 }}>(4½ x 4½)</Text>
            </View>
            <View style={{ width: '50%', borderRight: '1px solid #000', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 10 }}>
              <Text style={{ fontSize: 8 }}>Firma del Solicitante (en el centro del rectángulo)</Text>
              <Text style={{ fontSize: 8 }}>Declaro que los datos que aparecen en este formulario se ajustan a la realidad</Text>
            </View>
            <View style={{ width: '25%', padding: 5 }}>
               <Text style={{ fontSize: 8, textAlign: 'center' }}>Fecha de Solicitud</Text>
               <View style={{ border: '1px solid #000', height: 20, marginBottom: 10 }} />
               <View style={{ border: '1px solid #000', height: 20, justifyContent: 'center', alignItems: 'center' }}>
                 <Text style={{ fontSize: 10 }}>{pasaporte}</Text>
               </View>
               <Text style={{ fontSize: 8, textAlign: 'center' }}>Número de Pasaporte</Text>
               <View style={{ border: '1px solid #000', height: 20, marginTop: 10, justifyContent: 'center', alignItems: 'center' }}>
                 <Text style={{ fontSize: 10 }}>{carnet}</Text>
               </View>
               <Text style={{ fontSize: 8, textAlign: 'center' }}>Carné de Identidad</Text>
            </View>
          </View>

          <Text style={{ fontSize: 9, fontWeight: 'bold', backgroundColor: '#e0e0e0', padding: 2, borderBottom: '1px solid #000' }}>Datos Generales (declare el nombre y apellidos tal y como está en su Certificado de Nacimiento)</Text>
          <View style={{ flexDirection: 'row', padding: 5, borderBottom: '1px solid #000' }}>
            <View style={{ width: '25%' }}><Text style={{ fontSize: 12 }}>{apellido1.toUpperCase()}</Text><Text style={{ fontSize: 8, borderTop: '1px solid #000' }}>Primer apellido</Text></View>
            <View style={{ width: '25%' }}><Text style={{ fontSize: 12 }}>{apellido2.toUpperCase()}</Text><Text style={{ fontSize: 8, borderTop: '1px solid #000' }}>Segundo apellido</Text></View>
            <View style={{ width: '25%' }}><Text style={{ fontSize: 12 }}>{primerNombre.toUpperCase()}</Text><Text style={{ fontSize: 8, borderTop: '1px solid #000' }}>Primer nombre</Text></View>
            <View style={{ width: '25%' }}><Text style={{ fontSize: 12 }}></Text><Text style={{ fontSize: 8, borderTop: '1px solid #000' }}>Segundo nombre</Text></View>
          </View>
          <View style={{ flexDirection: 'row', borderBottom: '1px solid #000' }}>
             <View style={{ width: '40%', padding: 5, borderRight: '1px solid #000' }}>
                <Text style={{ fontSize: 10 }}>Hijo de: Padre: {padre.toUpperCase()}</Text>
                <Text style={{ fontSize: 10 }}>Madre: {madre.toUpperCase()}</Text>
             </View>
             <View style={{ width: '60%', padding: 5, flexDirection: 'row', flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 9, width: '33%' }}>Sexo: {sexo}</Text>
                <Text style={{ fontSize: 9, width: '33%' }}>Color Ojos: </Text>
                <Text style={{ fontSize: 9, width: '33%' }}>Color Piel: </Text>
                <Text style={{ fontSize: 9, width: '33%' }}>Estatura: </Text>
                <Text style={{ fontSize: 9, width: '33%' }}>Estado Civil: {estadoCivil.toUpperCase()}</Text>
                <Text style={{ fontSize: 9, width: '33%' }}>Color Cabello: </Text>
             </View>
          </View>

          <Text style={{ fontSize: 9, fontWeight: 'bold', backgroundColor: '#e0e0e0', padding: 2, borderBottom: '1px solid #000' }}>Lugar de Residencia actual</Text>
          <View style={{ padding: 5, borderBottom: '1px solid #000' }}>
            <Text style={{ fontSize: 10 }}>{direccion.toUpperCase()}</Text>
            <Text style={{ fontSize: 8 }}>Dirección (Calle, Ave, Nr., Apto, entre calles)</Text>
            <View style={{ flexDirection: 'row', marginTop: 5 }}>
              <View style={{ width: '50%' }}><Text style={{ fontSize: 10 }}>Brasil</Text><Text style={{ fontSize: 8 }}>País</Text></View>
              <View style={{ width: '50%' }}><Text style={{ fontSize: 10 }}>{telefono}</Text><Text style={{ fontSize: 8 }}>Teléfono</Text></View>
            </View>
          </View>

          <Text style={{ fontSize: 9, fontWeight: 'bold', backgroundColor: '#e0e0e0', padding: 2, borderBottom: '1px solid #000' }}>Datos Laborales o de Estudio actual</Text>
          <View style={{ padding: 5, borderBottom: '1px solid #000', flexDirection: 'row' }}>
             <View style={{ width: '50%' }}><Text style={{ fontSize: 10 }}>{ocupacion.toUpperCase()}</Text><Text style={{ fontSize: 8 }}>Profesión / Ocupación</Text></View>
             <View style={{ width: '50%' }}><Text style={{ fontSize: 10 }}>{email}</Text><Text style={{ fontSize: 8 }}>E-mail</Text></View>
          </View>

          <View style={{ padding: 20, alignItems: 'center', marginTop: 40 }}>
             <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Nota: Esta es una representación simplificada de la Planilla Consular para facilitar la recolección de datos.</Text>
             <Text style={{ fontSize: 10 }}>Debe descargar o solicitar la planilla original de la embajada si exigen formato exacto.</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const InscripcionConsularDoc = ({ cliente }) => {
  const nombre = cliente.nombre || '';
  const nombresArr = nombre.split(' ');
  const apellido1 = nombresArr.length > 1 ? nombresArr[nombresArr.length - 2] : '';
  const apellido2 = nombresArr.length > 1 ? nombresArr[nombresArr.length - 1] : '';
  const primerNombre = nombresArr.length > 2 ? nombresArr.slice(0, nombresArr.length - 2).join(' ') : nombresArr[0];

  const fechaNac = cliente.fecha_nacimiento ? new Date(cliente.fecha_nacimiento).toLocaleDateString('pt-BR') : '';
  const identidad = cliente.cpf || '';
  const pasaporte = cliente.numero_pasaporte || '';
  const rne = cliente.rnm || '';
  const estadoCivil = cliente.estado_civil || '';
  const ocupacion = cliente.profesion || '';
  const madre = cliente.nombre_madre || '';
  const padre = cliente.nombre_padre || '';
  const direccion = cliente.direccion || '';
  const telefono = cliente.telefono || '';
  const email = cliente.email || '';
  const sexo = cliente.sexo || '';

  const Field = ({ label, value, width = '100%' }) => (
    <View style={{ width, flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' }}>
      <Text style={{ fontSize: 10, marginRight: 5 }}>{label}</Text>
      <View style={{ flex: 1, borderBottom: '1px solid #000' }}>
        <Text style={{ fontSize: 10 }}>{value}</Text>
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={{...styles.page, padding: 30}}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={{ width: '40%' }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', fontStyle: 'italic', textAlign: 'center' }}>Consulado General de Cuba</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', fontStyle: 'italic', textAlign: 'center' }}>São Paulo</Text>
            
            <View style={{ border: '1px solid #000', width: '80%', height: 60, alignSelf: 'center', marginTop: 20, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 5 }}>
              <Text style={{ fontSize: 8 }}>Firma del solicitante</Text>
            </View>
          </View>
          
          <View style={{ width: '40%', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>SOLICITUD DE INSCRIPCIÓN CONSULAR</Text>
            <View style={{ border: '1px solid #000', width: 100, height: 120, marginTop: 10, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 12 }}>FOTO</Text>
            </View>
          </View>
        </View>

        <Text style={{ fontSize: 10, marginBottom: 15 }}>Sao Paulo {getCurrentDateFormatted()}</Text>
        <Text style={{ fontSize: 10, marginBottom: 15 }}>Sr. Cónsul General:</Text>
        <Text style={{ fontSize: 10, marginBottom: 20, textAlign: 'justify' }}>
          El que suscribe solicita ser inscripto en el Registro de Ciudadanos Cubanos del Consulado General de la República de Cuba en São Paulo, para lo cual ofrece los siguientes datos:
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="primer nombre" value={primerNombre.toUpperCase()} width="48%" />
          <Field label="segundo nombre" value="" width="48%" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="primer apellido" value={apellido1.toUpperCase()} width="48%" />
          <Field label="segundo apellido" value={apellido2.toUpperCase()} width="48%" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="estado civil" value={estadoCivil.toUpperCase()} width="48%" />
          <Field label="apellido de casado (a)" value="" width="48%" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="fecha de nacimiento" value={fechaNac} width="48%" />
          <Field label="país de nacimiento" value="CUBA" width="48%" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="provincia de nacimiento" value="" width="48%" />
          <Field label="municipio de nacimiento" value="" width="48%" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="Registro civil de nacimiento" value="" width="50%" />
          <Field label="tomo" value="" width="20%" />
          <Field label="folio" value="" width="20%" />
        </View>

        <Field label="Nombres y apellidos de mi madre" value={madre.toUpperCase()} />
        <Field label="Nombres y apellidos de mi padre" value={padre.toUpperCase()} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 10, marginRight: 5 }}>Color del:</Text>
          <Field label="Pelo" value="" width="20%" />
          <Field label="ojos" value="" width="20%" />
          <Field label="piel" value="" width="20%" />
          <Field label="estatura" value="" width="20%" />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="sexo" value={sexo.toUpperCase()} width="30%" />
          <Field label="No. Permanente de Identidad (CPF/RNM)" value={identidad} width="65%" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="Nivel cultural" value="" width="48%" />
          <Field label="profesión" value={ocupacion.toUpperCase()} width="48%" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="ocupación" value={ocupacion.toUpperCase()} width="48%" />
          <Field label="No. RNE" value={rne} width="48%" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="No. Celular" value={telefono} width="48%" />
          <Field label="E-mail" value={email} width="48%" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="Pasaporte: No." value={pasaporte} width="30%" />
          <Field label="Fecha Expedición" value="" width="30%" />
          <Field label="Fecha Vencimiento" value="" width="30%" />
        </View>

        <Text style={{ fontSize: 10, fontWeight: 'bold', marginTop: 15, marginBottom: 10 }}>Dirección Actual en Brasil:</Text>
        <Field label="Avenida o calle" value={direccion.toUpperCase()} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Field label="barrio" value="" width="30%" />
          <Field label="ciudad" value="" width="30%" />
          <Field label="estado" value="" width="30%" />
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
