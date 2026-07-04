import os
import sys
import subprocess
import argparse

def install_python_deps():
    print("Verifica delle dipendenze Python...")
    try:
        import fastapi
        import uvicorn
        import sqlalchemy
        import openpyxl
        import pandas
        import requests
        print("Dipendenze Python già soddisfatte.")
    except ImportError:
        print("Dipendenze Python mancanti. Installazione in corso via pip...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"], check=True)
            print("Dipendenze Python installate con successo.")
        except subprocess.CalledProcessError as e:
            print(f"Errore durante l'installazione delle dipendenze Python: {e}")
            sys.exit(1)

def build_frontend():
    print("Verifica della build del frontend React...")
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
    dist_dir = os.path.join(frontend_dir, "dist")
    
    if not os.path.exists(dist_dir) or "--rebuild" in sys.argv:
        print("La cartella di build del frontend non esiste o è stato richiesto il rebuild.")
        print("Compilazione del frontend in corso (npm run build)...")
        # Check node_modules
        node_modules = os.path.join(frontend_dir, "node_modules")
        if not os.path.exists(node_modules):
            print("Cartella node_modules mancante. Esecuzione di npm install...")
            try:
                subprocess.run("npm install", shell=True, cwd=frontend_dir, check=True)
            except subprocess.CalledProcessError as e:
                print(f"Errore durante npm install: {e}")
                sys.exit(1)
                
        try:
            subprocess.run("npm run build", shell=True, cwd=frontend_dir, check=True)
            print("Frontend compilato con successo.")
        except subprocess.CalledProcessError as e:
            print(f"Errore durante la compilazione del frontend: {e}")
            sys.exit(1)
    else:
        print("Build del frontend già presente in frontend/dist.")

def start_backend():
    print("Avvio del server di backend Uvicorn in modalità Produzione...")
    # Add project root to python path to resolve 'backend' package
    os.environ["PYTHONPATH"] = os.path.dirname(os.path.abspath(__file__))
    
    cmd = [
        "uvicorn",
        "backend.main:app",
        "--host", "0.0.0.0",
        "--port", "8000"
    ]
    print(f"Esecuzione: {' '.join(cmd)}")
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\nServer arrestato.")
    except Exception as e:
        print(f"Errore durante l'avvio del server: {e}")

def start_dev_mode():
    print("Avvio dei server di sviluppo (Backend + Frontend)...")
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
    
    # 1. Verifica node_modules del frontend
    node_modules = os.path.join(frontend_dir, "node_modules")
    if not os.path.exists(node_modules):
        print("Cartella node_modules del frontend mancante. Esecuzione di npm install...")
        try:
            subprocess.run("npm install", shell=True, cwd=frontend_dir, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Errore durante npm install: {e}")
            sys.exit(1)

    # 2. Configura PYTHONPATH per il backend
    env = os.environ.copy()
    env["PYTHONPATH"] = os.path.dirname(os.path.abspath(__file__))
    
    # 3. Definisci i comandi
    # Su Windows usiamo shell=True per entrambi i comandi
    backend_cmd = "uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"
    frontend_cmd = "npm run dev"
    
    processes = []
    import threading
    
    def print_output(process, name):
        try:
            for line in iter(process.stdout.readline, ''):
                if line:
                    print(f"[{name}] {line.strip()}")
        except Exception:
            pass
        finally:
            try:
                process.stdout.close()
            except Exception:
                pass
            
    try:
        # Avvia frontend
        print("Avvio di Vite (Frontend)...")
        p_front = subprocess.Popen(
            frontend_cmd,
            shell=True,
            cwd=frontend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        processes.append((p_front, "Frontend"))
        
        # Avvia backend
        print("Avvio di Uvicorn (Backend)...")
        p_back = subprocess.Popen(
            backend_cmd,
            shell=True,
            cwd=os.path.dirname(os.path.abspath(__file__)),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        processes.append((p_back, "Backend"))
        
        t_front = threading.Thread(target=print_output, args=(p_front, "Frontend"), daemon=True)
        t_back = threading.Thread(target=print_output, args=(p_back, "Backend"), daemon=True)
        
        t_front.start()
        t_back.start()
        
        print("\n" + "="*60)
        print(" Entrambi i server sono in esecuzione!")
        print(" - Frontend (Vite): http://localhost:5173")
        print(" - Backend (FastAPI): http://localhost:8000")
        print(" Premi Ctrl+C per arrestare entrambi i server contemporaneamente.")
        print("="*60 + "\n")
        
        while True:
            # Check se uno dei processi è terminato inaspettatamente
            for p, name in processes:
                if p.poll() is not None:
                    print(f"\nIl processo {name} è terminato con codice {p.returncode}.")
                    return
            import time
            time.sleep(0.5)
            
    except KeyboardInterrupt:
        print("\nRicevuto segnale di interruzione. Arresto dei server...")
    finally:
        # Assicuriamoci di terminare tutti i processi figli
        for p, name in processes:
            if p.poll() is None:
                print(f"Chiusura del processo {name}...")
                try:
                    if sys.platform == "win32":
                        # taskkill /F /T chiude l'intero albero di processi generato dalla shell
                        subprocess.run(f"taskkill /F /T /PID {p.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    else:
                        p.terminate()
                        p.wait(timeout=2)
                except Exception:
                    try:
                        p.kill()
                    except Exception:
                        pass
        print("Tutti i server sono stati arrestati.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gestore Avvio Web App Giacenza PrestaShop")
    parser.add_argument("--dev", action="store_true", help="Avvia sia backend che frontend in modalità di sviluppo contemporaneamente")
    parser.add_argument("--rebuild", action="store_true", help="Forza la compilazione del frontend React (per produzione)")
    
    args = parser.parse_args()
    
    # 1. Install Python dependencies if needed
    install_python_deps()
    
    # 2. Avvio
    if args.dev:
        start_dev_mode()
    else:
        # Produzione: build frontend e poi avvio backend
        build_frontend()
        start_backend()
