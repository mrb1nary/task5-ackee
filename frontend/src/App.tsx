import { WalletAdapter } from "./WalletAdapter"
import { ChakraProvider } from "@chakra-ui/react"


function App() {

  return (
    <>
      <ChakraProvider>
        <WalletAdapter/>
      </ChakraProvider>
    </>
  )
}

export default App
