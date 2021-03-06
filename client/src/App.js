import { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import * as solanaWeb3 from '@solana/web3.js';
import {Program, Provider, web3} from '@project-serum/anchor';

import idl from './idl.json';
import kp from './keypair.json'

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get our program's id form the IDL file.
const programID = new solanaWeb3.PublicKey(idl.metadata.address);

// Set our network to devent.
const network = solanaWeb3.clusterApiUrl('devnet');

// Control's how we want to acknowledge when a trasnaction is "done".
const opts = {
  preflightCommitment: "processed"
}

const App = () => {
  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [gifList, setGifList] = useState([]);

  // Actions
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet found!");
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            "Connected with Public Key:",
            response.publicKey.toString()
          );

          /*
           * Set the user's publicKey in state to be used later!
           */
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert("Solana object not found! Get a Phantom Wallet 👻");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log("Connected with Public Key:", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const registerAirNft = async () => {
    if (inputValue.length === 0) {
      console.log("No AirNft link given!")
      return
    }
    setInputValue('');
    console.log('AirNft Access link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
  
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("AirNft successfully sent to program", inputValue)
  
      await getGifList();
    } catch (error) {
      console.log("Error sending AirNft:", error)
    }
  };
  
  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new solanaWeb3.Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const createAirNftAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();
  
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't been initialized.
      if (gifList === null) {
        return (
          <div className="connected-container">
            <button className="cta-button submit-airnft-button" onClick={createAirNftAccount}>
              Initialize AirNFT Program Account
            </button>
          </div>
        )
      }
      // Otherwise, we're good! Account exists. User can submit GIFs.
      else {
        return(
          <div className="connected-container">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                registerAirNft();
              }}
            >
              <input
                type="text"
                placeholder="Enter AirNft Access link!"
                value={inputValue}
                onChange={onInputChange}
              />
              <button type="submit" className="cta-button submit-airnft-button">
                Submit
              </button>
            </form>
            <div className="airnft-grid">
              {/* We use index as the key instead, also, the src is now item.gifLink */}
              {gifList.map((item, index) => {
                if (index >= 3) {
                  return (
                    <div className="gif-item" key={index}>
                      {/* <img src={item.gifLink} /> */}
                      <iframe
                        id={"air-nft-" + index}
                        className="air-nft-Frame"
                        src={item.gifLink}
                      ></iframe>
                      <div className="gif-item-info">
                        Your search for interactive NFTs ends here! 
                        <button
                          className="playNFT"
                          onClick={() => {
                            window.location.reload();
                            var container = document.getElementById(
                              "air-nft-" + index
                            );
                            var content = container.innerHTML;
                            container.innerHTML = content;
                          }}
                        >
                          Refresh
                        </button>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        )
      }
    }

  // UseEffects
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      console.log("Got the account", account)
      setGifList(account.gifList)
  
    } catch (error) {
      console.log("Error in getGifs: ", error)
      setGifList(null);
    }
  }
  
  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching AirNft list...');
      getGifList()
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">Augmented Interactive Reality NFT Platform</p>
          <p className="sub-text">
            Launch and Explore AIR NFT collection
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {/* We just need to add the inverse here! */}
          {walletAddress && renderConnectedContainer()}
        </div>
      </div>
    </div>
  );
};

export default App;