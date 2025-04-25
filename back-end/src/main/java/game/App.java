package game;

import java.io.IOException;
import java.util.Arrays;
import java.util.Map;
import java.util.Stack;
import fi.iki.elonen.NanoHTTPD;

public class App extends NanoHTTPD {

    public static void main(String[] args) {
        try {
            new App();
        } catch (IOException ioe) {
            System.err.println("Couldn't start server:\n" + ioe);
        }
    }

    private Game game;
    private Stack<Game> history;

    public App() throws IOException {
        super(8080);
        this.game = new Game();
        this.history = new Stack<>();
        start(NanoHTTPD.SOCKET_READ_TIMEOUT, false);
        System.out.println("\nRunning!\n");
    }

    @Override
    public Response serve(IHTTPSession session) {
        String uri = session.getUri();
        Map<String, String> params = session.getParms();
        GameState gameplay;

        try {
            if (uri.equals("/newgame")) {
                this.history.clear();
                this.game = new Game();
            } else if (uri.equals("/play")) {
                int x = Integer.parseInt(params.get("x"));
                int y = Integer.parseInt(params.get("y"));
                if (this.game.getBoard().getCell(x, y) == null && this.game.getWinner() == null) {
                    this.history.push(this.game);
                    this.game = this.game.play(x, y);
                }
            } else if (uri.equals("/undo")) {
              
                    this.game = this.history.undo();
                
            }

            gameplay = GameState.forGame(this.game);
            String response = String.format(
                    "{\"cells\": %s, \"currentPlayer\": %d, \"winner\": %s, \"canUndo\": %b}",
                    Arrays.toString(gameplay.getCells()),
                    this.game.getPlayer().value,
                    this.game.getWinner() != null ? this.game.getWinner().value : "null",
                    !this.history.isEmpty());
            return newFixedLengthResponse(response);
        } catch (Exception e) {
            System.err.println("Server error: " + e.getMessage());
            return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "application/json",
                    "{\"error\": \"Server error occurred\"}");
        }
    }

    public static class Test {
        public String getText() {
            return "Hello World!";
        }
    }
}