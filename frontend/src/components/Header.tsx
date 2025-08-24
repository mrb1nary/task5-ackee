import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"

function Header() {
    
    return (
      <div className="bg-gray-800 text-white flex items-center w-full justify-between px-10 py-2 shadow-lg">
        <div className="flex space-x-8 cursor-pointer">
          <h4 className="flex justify-center items-center text-2xl hover:opacity-75 transition-opacity duration-300">Solana Twitter</h4>
          {/* <h5 className="flex items-center justify-center text-xl hover:opacity-75 transition-opacity duration-300">About</h5> */}
        </div>
        
        <WalletMultiButton className="hover:opacity-90 transition-opacity duration-300"/>
      </div>
    );
  }
  

export default Header