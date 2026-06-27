const fs = require('fs');
const path = './src/components/ClientView.jsx';
let content = fs.readFileSync(path, 'utf8');
let lines = content.split('\n');

// 1. Delete renderUnifiedPersonalData definition (lines 931 to 1304, which is index 930 to 1303)
// Wait, to be safe against line shifts, let's find the indices by string matching.

const renderUnifiedStart = lines.findIndex(l => l.includes('const renderUnifiedPersonalData = () => {'));
const returnStart = lines.findIndex((l, i) => i > renderUnifiedStart && l.includes('return (') && lines[i+1].includes('padding: \'2.5rem\''));
// Wait, return ( is at 1307. So the closing of renderUnified is at 1304: `  };`
const renderUnifiedEnd = returnStart - 3; 

// 2. Relacionamientos
const relStart = lines.findIndex(l => l.includes('<section id="relacionamientos-clientes"'));
const relEnd = lines.findIndex((l, i) => i > relStart && l.includes('</section>'));

// 3. Documentos
const docStart = lines.findIndex((l, i) => i > relEnd && l.includes('<section id="documentos-subidos"'));
const docEnd = lines.findIndex((l, i) => i > docStart && l.includes('</section>'));

// Now replace in reverse order so line numbers don't shift!

lines.splice(docStart, docEnd - docStart + 1, `          <ClientDocuments
            documentos={documentos}
            uploading={uploading}
            isDragging={isDragging}
            draggedDocument={draggedDocument}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            handleFileUpload={handleFileUpload}
            setDraggedDocument={setDraggedDocument}
            setDragOverRelId={setDragOverRelId}
            setViewingDocument={setViewingDocument}
            handleDeleteDocument={handleDeleteDocument}
          />`);

lines.splice(relStart, relEnd - relStart + 1, `          <ClientRelations
            relaciones={relaciones}
            clientId={clientId}
            draggedDocument={draggedDocument}
            dragOverRelId={dragOverRelId}
            setDragOverRelId={setDragOverRelId}
            handleCopyDocumentToClient={handleCopyDocumentToClient}
            onNavigateToClient={onNavigateToClient}
            editingRelId={editingRelId}
            setEditingRelId={setEditingRelId}
            handleUpdateRelationType={handleUpdateRelationType}
            handleDeleteRelation={handleDeleteRelation}
            setSearchQuery={setSearchQuery}
            setSelectedRelateId={setSelectedRelateId}
            setIsRelateModalOpen={setIsRelateModalOpen}
          />`);

// 4. Find the `{renderUnifiedPersonalData()}` call and replace it
const callIdx = lines.findIndex(l => l.includes('{renderUnifiedPersonalData()}'));
lines.splice(callIdx, 1, `          <ClientPersonalData
            client={client}
            categorias={categorias}
            campos={campos}
            clienteDatos={clienteDatos}
            fixedFields={FIXED_FIELDS_CATALOG}
            localSearchQuery={localSearchQuery}
            setLocalSearchQuery={setLocalSearchQuery}
            openEditModal={openEditModal}
            handleCopy={handleCopy}
            copiedId={copiedId}
          />`);

// 5. Delete renderUnifiedPersonalData definition
lines.splice(renderUnifiedStart, renderUnifiedEnd - renderUnifiedStart + 1);

fs.writeFileSync(path, lines.join('\n'));
console.log('Refactoring complete');
