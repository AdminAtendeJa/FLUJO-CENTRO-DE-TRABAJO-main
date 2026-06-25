const fs = require('fs');
const path = require('path');

const appPath = path.resolve(__dirname, '../src/App.jsx');
const clientViewPath = path.resolve(__dirname, '../src/components/ClientView.jsx');

let appContent = '';
let clientViewContent = '';

try {
  appContent = fs.readFileSync(appPath, 'utf8');
} catch (err) {
  console.error('Failed to read App.jsx:', err.message);
}

try {
  clientViewContent = fs.readFileSync(clientViewPath, 'utf8');
} catch (err) {
  console.error('Failed to read ClientView.jsx:', err.message);
}

const tests = [
  // TIER 1 - Feature 1: Global Static Layout
  {
    id: 1,
    tier: 1,
    feature: 1,
    name: "App.jsx contains overflow: 'hidden' to restrict global page scroll",
    testFn: () => {
      const match = appContent.includes("overflow: 'hidden'") || appContent.includes('overflow: "hidden"');
      return { pass: match, message: match ? "Found overflow: 'hidden'" : "Missing overflow: 'hidden' in App.jsx" };
    }
  },
  {
    id: 2,
    tier: 1,
    feature: 1,
    name: "App.jsx layout wrapper uses height: '100vh' to lock viewport height",
    testFn: () => {
      const match = appContent.includes("height: '100vh'") || appContent.includes('height: "100vh"');
      return { pass: match, message: match ? "Found height: '100vh'" : "Missing height: '100vh' in App.jsx" };
    }
  },
  {
    id: 3,
    tier: 1,
    feature: 1,
    name: "App.jsx layout container has style display: 'flex'",
    testFn: () => {
      const match = appContent.includes("display: 'flex'") || appContent.includes('display: "flex"');
      return { pass: match, message: match ? "Found display: 'flex'" : "Missing display: 'flex' in App.jsx" };
    }
  },
  {
    id: 4,
    tier: 1,
    feature: 1,
    name: "App.jsx root element has className 'app-layout'",
    testFn: () => {
      const match = appContent.includes('className="app-layout"') || appContent.includes("className='app-layout'");
      return { pass: match, message: match ? "Found app-layout class name" : "Missing className='app-layout' in App.jsx" };
    }
  },
  {
    id: 5,
    tier: 1,
    feature: 1,
    name: "App.jsx has a <main> container to hold the view components",
    testFn: () => {
      const match = appContent.includes("<main") && appContent.includes("</main>");
      return { pass: match, message: match ? "Found <main> container" : "Missing <main> tag in App.jsx" };
    }
  },

  // TIER 1 - Feature 2: Fixed AI Chat Sidebar
  {
    id: 6,
    tier: 1,
    feature: 2,
    name: "ClientView.jsx contains AI Chat assistant text",
    testFn: () => {
      const match = clientViewContent.includes("Asistente IA");
      return { pass: match, message: match ? "Found Asistente IA reference" : "Missing Asistente IA reference in ClientView.jsx" };
    }
  },
  {
    id: 7,
    tier: 1,
    feature: 2,
    name: "ClientView.jsx uses grid/flex layout template with 3 columns",
    testFn: () => {
      const match = /gridTemplateColumns:\s*['"]\d+(?:px|rem|%|fr)?\s+\w+\s+\d+(?:px|rem|%|fr)?['"]/.test(clientViewContent) ||
                    /gridTemplateColumns:\s*['"][^'"]+\s+[^'"]+\s+[^'"]+['"]/.test(clientViewContent);
      return { pass: match, message: match ? "Found 3-column grid layout" : "Missing 3-column layout (e.g. gridTemplateColumns: '240px 1fr 400px') in ClientView.jsx" };
    }
  },
  {
    id: 8,
    tier: 1,
    feature: 2,
    name: "ClientView.jsx right-hand sidebar has dedicated width (e.g. 400px)",
    testFn: () => {
      const match = clientViewContent.includes("width: '400px'") || clientViewContent.includes("width: '350px'") || clientViewContent.includes('width: "400px"');
      return { pass: match, message: match ? "Found sidebar width style" : "Missing explicit sidebar width (350px/400px) in ClientView.jsx" };
    }
  },
  {
    id: 9,
    tier: 1,
    feature: 2,
    name: "ClientView.jsx AI Chat uses flex layout for internals",
    testFn: () => {
      const match = clientViewContent.includes("display: 'flex'") && clientViewContent.includes("flexDirection: 'column'") && clientViewContent.includes("aiChatMessages");
      return { pass: match, message: match ? "Found flex layout for chat internals" : "Missing flex column layout on AI Chat in ClientView.jsx" };
    }
  },
  {
    id: 10,
    tier: 1,
    feature: 2,
    name: "ClientView.jsx imports Sparkles or Send icon for chat interface",
    testFn: () => {
      const match = clientViewContent.includes("Sparkles") && clientViewContent.includes("Send");
      return { pass: match, message: match ? "Found Sparkles and Send icon imports" : "Missing Sparkles/Send icon imports in ClientView.jsx" };
    }
  },

  // TIER 1 - Feature 3: Unified Central Scroll
  {
    id: 11,
    tier: 1,
    feature: 3,
    name: "ClientView.jsx renders a unified container instead of only activeTab content",
    testFn: () => {
      const match = !/categorias\.find\(c\s*=>\s*c\.id\s*===\s*activeTab\)\?\.nombre/.test(clientViewContent);
      return { pass: match, message: match ? "Categories are not filtered dynamically by activeTab for reading" : "Found activeTab filter limiting display to a single category" };
    }
  },
  {
    id: 12,
    tier: 1,
    feature: 3,
    name: "ClientView.jsx center column contains overflowY: 'auto' or 'scroll'",
    testFn: () => {
      const match = clientViewContent.includes("overflowY: 'auto'") || clientViewContent.includes('overflowY: "auto"') ||
                    clientViewContent.includes("overflowY: 'scroll'") || clientViewContent.includes('overflowY: "scroll"');
      return { pass: match, message: match ? "Found overflowY scroll style" : "Missing overflowY: 'auto' in ClientView.jsx" };
    }
  },
  {
    id: 13,
    tier: 1,
    feature: 3,
    name: "ClientView.jsx renders sections stacked vertically",
    testFn: () => {
      const match = /id=\s*['"](?:personal|family|document|datos|info)/.test(clientViewContent);
      return { pass: match, message: match ? "Found sections with ids for stacked layout" : "Missing section elements/ids for Datos Personales, Familiares, Documentos" };
    }
  },
  {
    id: 14,
    tier: 1,
    feature: 3,
    name: "ClientView.jsx uses flex/grid layout partition to separate main content",
    testFn: () => {
      const match = clientViewContent.includes("display: 'grid'") || clientViewContent.includes("display: 'flex'") ||
                    clientViewContent.includes('display: "grid"') || clientViewContent.includes('display: "flex"');
      return { pass: match, message: match ? "Found layout layout grid/flex style" : "Missing grid/flex layout container in ClientView.jsx" };
    }
  },
  {
    id: 15,
    tier: 1,
    feature: 3,
    name: "ClientView.jsx defines containers for stacked content",
    testFn: () => {
      const match = clientViewContent.includes("className=\"glass-panel\"") || clientViewContent.includes("className='glass-panel'") ||
                    clientViewContent.includes("className=\"glass-panel-elevated\"") || clientViewContent.includes("<section");
      return { pass: match, message: match ? "Found glass-panel/section containers" : "Missing container styles/classes for sections in ClientView.jsx" };
    }
  },

  // TIER 1 - Feature 4: Left-hand Quick Nav
  {
    id: 16,
    tier: 1,
    feature: 4,
    name: "ClientView.jsx has a left-hand navigation column/container",
    testFn: () => {
      const match = /quick-nav|quickNav|aside/i.test(clientViewContent);
      return { pass: match, message: match ? "Found left navigation container reference" : "Missing quick-nav / navigation sidebar in ClientView.jsx" };
    }
  },
  {
    id: 17,
    tier: 1,
    feature: 4,
    name: "Left Nav renders anchor elements or buttons to jump to sections",
    testFn: () => {
      const match = clientViewContent.includes("scrollIntoView");
      return { pass: match, message: match ? "Found scrollIntoView triggers for nav anchors" : "Missing anchor buttons or links using scrollIntoView in Left Nav" };
    }
  },
  {
    id: 18,
    tier: 1,
    feature: 4,
    name: "Left Nav anchors have click handlers",
    testFn: () => {
      const match = clientViewContent.includes("onClick") && clientViewContent.includes("scrollIntoView");
      return { pass: match, message: match ? "Found onClick and scrollIntoView interaction" : "Missing onClick scrollIntoView handlers in Left Nav" };
    }
  },
  {
    id: 19,
    tier: 1,
    feature: 4,
    name: "ClientView.jsx references scrollIntoView API",
    testFn: () => {
      const match = clientViewContent.includes("scrollIntoView");
      return { pass: match, message: match ? "Found scrollIntoView references" : "Missing scrollIntoView DOM API call in ClientView.jsx" };
    }
  },
  {
    id: 20,
    tier: 1,
    feature: 4,
    name: "ClientView.jsx defines scroll-target section IDs or refs",
    testFn: () => {
      const match = /id=\s*['"](?:personal|family|document|datos|info)/.test(clientViewContent);
      return { pass: match, message: match ? "Found scroll targets" : "Missing ID scroll-targets in ClientView.jsx sections" };
    }
  },

  // TIER 2 - Feature 1: Global Static Layout
  {
    id: 21,
    tier: 2,
    feature: 1,
    name: "App.jsx does not override overflow-y with scroll globally",
    testFn: () => {
      const match = !appContent.includes("overflowY: 'scroll'") && !appContent.includes('overflowY: "scroll"');
      return { pass: match, message: match ? "No global overflowY: 'scroll' found" : "Found global overflowY: 'scroll' which causes body scrolling" };
    }
  },
  {
    id: 22,
    tier: 2,
    feature: 1,
    name: "App.jsx does not contain layout styles matching overflow: 'scroll'",
    testFn: () => {
      const match = !/app-layout.*overflow:\s*['"]scroll['"]/.test(appContent);
      return { pass: match, message: match ? "No overflow: 'scroll' on layout root" : "Found overflow: 'scroll' on app-layout" };
    }
  },
  {
    id: 23,
    tier: 2,
    feature: 1,
    name: "App.jsx main viewport wrapper height is not hardcoded to a small static value like 500px",
    testFn: () => {
      const match = !/app-layout.*height:\s*['"]500px['"]/.test(appContent);
      return { pass: match, message: match ? "Height is viewport relative or large" : "Found static height of 500px on app-layout" };
    }
  },
  {
    id: 24,
    tier: 2,
    feature: 1,
    name: "App.jsx top bar header has a high zIndex to prevent overlap",
    testFn: () => {
      const match = /zIndex:\s*(?:10|\d{2,})/.test(appContent);
      return { pass: match, message: match ? "Found appropriate zIndex on header" : "Missing zIndex >= 10 on header in App.jsx" };
    }
  },
  {
    id: 25,
    tier: 2,
    feature: 1,
    name: "App.jsx aside sidebar uses fixed width to maintain layout proportions",
    testFn: () => {
      const match = appContent.includes("width: '240px'") || appContent.includes('width: "240px"');
      return { pass: match, message: match ? "Found sidebar width: '240px'" : "Missing width: '240px' for sidebar in App.jsx" };
    }
  },

  // TIER 2 - Feature 2: Fixed AI Chat Sidebar
  {
    id: 26,
    tier: 2,
    feature: 2,
    name: "AI Chat sidebar does not use high zIndex overlay styles",
    testFn: () => {
      const match = !/position:\s*['"]fixed['"].*zIndex:\s*1000/.test(clientViewContent) && !/zIndex:\s*1000.*position:\s*['"]fixed['"]/.test(clientViewContent);
      return { pass: match, message: match ? "AI Chat is not styled as a high zIndex overlay" : "Found zIndex 1000 with position fixed on AI Chat (overlay drawer style)" };
    }
  },
  {
    id: 27,
    tier: 2,
    feature: 2,
    name: "AI Chat sidebar does not use position: fixed when persistent",
    testFn: () => {
      const match = !/position:\s*['"]fixed['"].*right:\s*isAiChatOpen/.test(clientViewContent);
      return { pass: match, message: match ? "AI Chat does not use position: fixed layout" : "Found position: fixed layout for AI Chat drawer" };
    }
  },
  {
    id: 28,
    tier: 2,
    feature: 2,
    name: "AI Chat textarea input is disabled during message loading",
    testFn: () => {
      const match = clientViewContent.includes("disabled={isAiChatLoading}");
      return { pass: match, message: match ? "Found disabled attribute on loading state" : "Missing disabled={isAiChatLoading} in ClientView.jsx textarea" };
    }
  },
  {
    id: 29,
    tier: 2,
    feature: 2,
    name: "AI Chat renders messages mapped from state",
    testFn: () => {
      const match = clientViewContent.includes("aiChatMessages.map");
      return { pass: match, message: match ? "Found message mapping" : "Missing aiChatMessages.map in ClientView.jsx" };
    }
  },
  {
    id: 30,
    tier: 2,
    feature: 2,
    name: "AI Chat send button is disabled when empty or loading",
    testFn: () => {
      const match = clientViewContent.includes("disabled={isAiChatLoading || !aiChatInput.trim()}");
      return { pass: match, message: match ? "Found disabled state for empty input/loading" : "Missing disabled={isAiChatLoading || !aiChatInput.trim()} in ClientView.jsx" };
    }
  },

  // TIER 2 - Feature 3: Unified Central Scroll
  {
    id: 31,
    tier: 2,
    feature: 3,
    name: "Central scroll container has height constraint (maxHeight or height calc)",
    testFn: () => {
      const match = /height:\s*['"]calc\(100vh/.test(clientViewContent) || /maxHeight:\s*['"]calc\(100vh/.test(clientViewContent) ||
                    /height:\s*['"]\d+/.test(clientViewContent) || /maxHeight:\s*['"]\d+/.test(clientViewContent) ||
                    /height:\s*['"]100%['"]/.test(clientViewContent) || /maxHeight:\s*['"]100%['"]/.test(clientViewContent);
      return { pass: match, message: match ? "Found height/max-height constraint" : "Missing height or maxHeight constraint on the scrollable container" };
    }
  },
  {
    id: 32,
    tier: 2,
    feature: 3,
    name: "Sections within scrollable container have distinct header elements",
    testFn: () => {
      const match = clientViewContent.includes("<h2") || clientViewContent.includes("<h3") || clientViewContent.includes("<h4");
      return { pass: match, message: match ? "Found header elements" : "Missing header elements (h2/h3) inside sections in ClientView.jsx" };
    }
  },
  {
    id: 33,
    tier: 2,
    feature: 3,
    name: "Scrollable container has padding spacing for layout breathing room",
    testFn: () => {
      const match = clientViewContent.includes("padding:") || clientViewContent.includes("paddingRight:") ||
                    clientViewContent.includes("paddingLeft:") || clientViewContent.includes("paddingY:") ||
                    clientViewContent.includes("paddingBottom:") || clientViewContent.includes("paddingTop:");
      return { pass: match, message: match ? "Found padding style on container" : "Missing padding spacing style on scrollable container" };
    }
  },
  {
    id: 34,
    tier: 2,
    feature: 3,
    name: "Scroll container handles empty data states gracefully",
    testFn: () => {
      const match = clientViewContent.includes("No hay datos") || clientViewContent.includes("empty") || clientViewContent.includes("!valor") || clientViewContent.includes("!dato");
      return { pass: match, message: match ? "Handles empty data state" : "Missing checks/placeholders for empty data sections" };
    }
  },
  {
    id: 35,
    tier: 2,
    feature: 3,
    name: "Scroll container does not contain overflow: 'hidden'",
    testFn: () => {
      const match = !/center-column.*overflow:\s*['"]hidden['"]/.test(clientViewContent);
      return { pass: match, message: match ? "Overflow hidden is not on center column" : "Found overflow: hidden on center-column which breaks scroll" };
    }
  },

  // TIER 2 - Feature 4: Left-hand Quick Nav
  {
    id: 36,
    tier: 2,
    feature: 4,
    name: "Left Nav items match the main client sections",
    testFn: () => {
      const match = clientViewContent.includes("Personales") || clientViewContent.includes("Familiares") || clientViewContent.includes("Documentos");
      return { pass: match, message: match ? "Found main client sections reference in Nav" : "Missing section names (Personales, Familiares, Documentos) in Left Nav" };
    }
  },
  {
    id: 37,
    tier: 2,
    feature: 4,
    name: "Left Nav uses smooth behavior for scrollIntoView calls",
    testFn: () => {
      const match = clientViewContent.includes("behavior: 'smooth'") || clientViewContent.includes('behavior: "smooth"') || clientViewContent.includes('behavior: "smooth"');
      return { pass: match, message: match ? "Found smooth scrolling behavior" : "Missing behavior: 'smooth' scroll option in scrollIntoView" };
    }
  },
  {
    id: 38,
    tier: 2,
    feature: 4,
    name: "Left Nav container remains sticky/fixed during scroll",
    testFn: () => {
      const match = clientViewContent.includes("position: 'sticky'") || clientViewContent.includes('position: "sticky"') ||
                    clientViewContent.includes("position: 'fixed'") || clientViewContent.includes('position: "fixed"');
      return { pass: match, message: match ? "Found sticky/fixed position style on Left Nav" : "Missing position: 'sticky' on Left Nav" };
    }
  },
  {
    id: 39,
    tier: 2,
    feature: 4,
    name: "Left Nav container has width/flex layout constraints to avoid layout shift",
    testFn: () => {
      const match = clientViewContent.includes("width:") || clientViewContent.includes("flex:") || clientViewContent.includes("flexBasis:") || clientViewContent.includes("flex-basis:");
      return { pass: match, message: match ? "Found layout constraints on Left Nav" : "Missing width or flex style constraints on Left Nav sidebar" };
    }
  },
  {
    id: 40,
    tier: 2,
    feature: 4,
    name: "Left Nav click handlers prevent default page reload",
    testFn: () => {
      const match = clientViewContent.includes("preventDefault") || /onClick.*scrollIntoView/.test(clientViewContent);
      return { pass: match, message: match ? "Click handlers prevent standard anchor reloads" : "Missing preventDefault() or button scroll handlers in Left Nav" };
    }
  },

  // TIER 3 - Feature Interaction Pairs
  {
    id: 41,
    tier: 3,
    feature: 2,
    name: "Layout & Chat Interaction: Main content wrapper and AI Chat use a non-overlapping grid/flex layout",
    testFn: () => {
      const match = /gridTemplateColumns:\s*['"][^'"]+\s+[^'"]+\s+[^'"]+['"]/.test(clientViewContent) &&
                    !/position:\s*['"]fixed['"].*zIndex:\s*1000/.test(clientViewContent);
      return { pass: match, message: match ? "Grid columns set and AI Chat is not fixed overlay drawer" : "AI Chat is still position: fixed overlay drawer instead of layout column" };
    }
  },
  {
    id: 42,
    tier: 3,
    feature: 3,
    name: "Scroll & Left Nav Interaction: Scroll container does not cause Left Nav to scroll out of viewport",
    testFn: () => {
      const match = (clientViewContent.includes("overflowY") || clientViewContent.includes("overflow-y")) &&
                    (clientViewContent.includes("position: 'sticky'") || clientViewContent.includes("position: 'fixed'") || /quick-nav|quickNav/i.test(clientViewContent));
      return { pass: match, message: match ? "Scroll container and Left Nav isolated correctly" : "Left Nav is not sticky/fixed, or scroll container is missing" };
    }
  },
  {
    id: 43,
    tier: 3,
    feature: 3,
    name: "Scroll & Chat Interaction: Scrolling center container does not scroll the AI Chat sidebar",
    testFn: () => {
      const match = (clientViewContent.includes("overflowY") || clientViewContent.includes("overflow-y")) &&
                    (clientViewContent.includes("Sparkles") || clientViewContent.includes("Asistente IA"));
      return { pass: match, message: match ? "Scroll container and Chat sidebar isolated correctly" : "Scroll container or Chat sidebar references missing" };
    }
  },
  {
    id: 44,
    tier: 3,
    feature: 4,
    name: "Left Nav & Scroll Target Interaction: Left Nav click targets match the section IDs in scroll container",
    testFn: () => {
      const match = /id=\s*['"](?:personal|family|document|datos|info)/.test(clientViewContent) &&
                    clientViewContent.includes("scrollIntoView");
      return { pass: match, message: match ? "Scroll target IDs exist and scrollIntoView triggers are present" : "Missing matched scroll target IDs and triggers" };
    }
  },

  // TIER 4 - Real-World Flow Validation
  {
    id: 45,
    tier: 4,
    feature: 1,
    name: "Viewport Responsiveness: Flex-grow or grid columns ensure the center column fills remaining space",
    testFn: () => {
      const match = clientViewContent.includes("flex: 1") || clientViewContent.includes("flexGrow: 1") ||
                    /gridTemplateColumns:\s*['"][^'"]*1fr[^'"]*['"]/.test(clientViewContent);
      return { pass: match, message: match ? "Flex grow/1fr grid used for center column responsiveness" : "No flex-grow or 1fr grid columns found for center content width" };
    }
  },
  {
    id: 46,
    tier: 4,
    feature: 1,
    name: "Full-Page Non-Scrollability: No root element allows overflowY scroll at global level",
    testFn: () => {
      const match = !/overflow-y:\s*['"]scroll['"]/.test(appContent) && !/overflowY:\s*['"]scroll['"]/.test(appContent);
      return { pass: match, message: match ? "No global overflowY scroll found" : "Global overflowY scroll detected on layout container" };
    }
  },
  {
    id: 47,
    tier: 4,
    feature: 2,
    name: "AI Chat Persistence: Chat panel is permanently embedded without a sliding position relative to state",
    testFn: () => {
      const match = !/right:\s*isAiChatOpen\s*\?\s*/.test(clientViewContent) && !/right:\s*['"]-400px['"]/.test(clientViewContent);
      return { pass: match, message: match ? "No sliding right style found" : "Found sliding right drawer position style dependent on isAiChatOpen state" };
    }
  },
  {
    id: 48,
    tier: 4,
    feature: 3,
    name: "DOM Anchoring Integrity: Sections are rendered sequentially within the unified scroll container",
    testFn: () => {
      const match = /id=\s*['"](?:personal|family|document|datos|info)/.test(clientViewContent);
      return { pass: match, message: match ? "Found sequential section anchors" : "Missing target sections in unified scroll container" };
    }
  },
  {
    id: 49,
    tier: 4,
    feature: 3,
    name: "Visual Hierarchy Spacing: Sections inside unified container use consistent margin or gap styles for breathability",
    testFn: () => {
      const match = clientViewContent.includes("gap:") || clientViewContent.includes("marginBottom:") || clientViewContent.includes("gap: '") || clientViewContent.includes('gap: "');
      return { pass: match, message: match ? "Spacing margins/gap found" : "No spacing margins/gap styling found in ClientView.jsx" };
    }
  }
];

module.exports = { tests };
