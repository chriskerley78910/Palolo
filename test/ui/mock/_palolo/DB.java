package _palolo;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class DB {
	
	protected static void executeCmd(String cmd) {
		
		try {
			
			
			   Process proc = Runtime.getRuntime().exec(cmd);

		       BufferedReader reader = new BufferedReader(new InputStreamReader(proc.getInputStream()));

		       String line = "";
		      
		       while((line = reader.readLine()) != null) {
		           
		    	 
		    	   System.out.print(line + "\n");
		       }

		       proc.waitFor();  
		       
		       
		       
			} catch (IOException e) {
				
				e.printStackTrace();
			} catch (InterruptedException e) {
					
				e.printStackTrace();
			}
		
	}
	
	
	public static void doNode(String path, String args) throws IOException {
		
		ProcessBuilder pb = new ProcessBuilder("node", path, args);
		pb.redirectOutput(ProcessBuilder.Redirect.INHERIT);
		pb.redirectError(ProcessBuilder.Redirect.INHERIT);
		pb.start();
	}
	


	public static void stopServers() {
		
		executeCmd(PageObjectModel.getProjectPath() + "/bin/stop_servers.sh");
	}
	
	
	public static void startServers() {
		
		executeCmd(PageObjectModel.getProjectPath() + "/bin/restart_servers.sh testing");
	}
	


}
