import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ClientData {
    name: string;
    responsible_name?: string;
    cnpj_cpf?: string;
    email?: string;
    address?: string;
}

interface ServiceData {
    name: string;
    value: number;
    type: string;
}

export const generatePDF = (type: 'contract' | 'proposal' | 'receipt', client: ClientData, services: ServiceData[], extraData?: any) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('Sucesso1000', 14, 22);
    doc.setFontSize(10);
    doc.text('Soluções Digitais e Inteligência Artificial', 14, 28);

    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    // Title
    doc.setFontSize(16);
    let title = '';
    switch (type) {
        case 'contract': title = 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS'; break;
        case 'proposal': title = 'PROPOSTA COMERCIAL'; break;
        case 'receipt': title = 'RECIBO DE PAGAMENTO'; break;
    }
    doc.text(title, 105, 45, { align: 'center' });

    // Client Info
    doc.setFontSize(12);
    doc.text('Dados do Cliente:', 14, 60);
    doc.setFontSize(10);
    doc.text(`Nome/Razão Social: ${client.name}`, 14, 68);
    if (client.responsible_name) doc.text(`Responsável: ${client.responsible_name}`, 14, 74);
    if (client.cnpj_cpf) doc.text(`CPF/CNPJ: ${client.cnpj_cpf}`, 14, 80);
    if (client.email) doc.text(`Email: ${client.email}`, 14, 86);

    // Content based on type
    let startY = 100;

    if (type === 'contract') {
        doc.text('CLÁUSULA 1 - DO OBJETO', 14, startY);
        doc.setFontSize(9);
        const text = 'O presente contrato tem como objeto a prestação dos serviços listados abaixo, a serem realizados pela CONTRATADA à CONTRATANTE.';
        const splitText = doc.splitTextToSize(text, 180);
        doc.text(splitText, 14, startY + 6);
        startY += 20;
    } else if (type === 'receipt') {
        doc.text(`Valor Total: R$ ${extraData?.totalValue || '0,00'}`, 14, startY);
        doc.text(`Data do Pagamento: ${extraData?.paymentDate || new Date().toLocaleDateString()}`, 14, startY + 6);
        startY += 20;
    }

    // Services Table
    if (services.length > 0) {
        autoTable(doc, {
            startY: startY,
            head: [['Serviço', 'Tipo', 'Valor (R$)']],
            body: services.map(s => [
                s.name,
                s.type,
                s.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
            ]),
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
        });
    }

    // Footer / Signatures
    const pageHeight = doc.internal.pageSize.height;

    if (type === 'contract' || type === 'proposal') {
        doc.line(14, pageHeight - 40, 90, pageHeight - 40);
        doc.text('Sucesso1000', 14, pageHeight - 35);

        doc.line(110, pageHeight - 40, 196, pageHeight - 40);
        doc.text(client.name, 110, pageHeight - 35);
    }

    doc.setFontSize(8);
    doc.text(`Gerado em ${new Date().toLocaleString()}`, 14, pageHeight - 10);

    // Save
    doc.save(`${type}_${client.name.replace(/\s+/g, '_')}.pdf`);
};
