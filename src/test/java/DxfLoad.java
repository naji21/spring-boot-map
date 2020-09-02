import java.awt.Color;
import java.io.BufferedOutputStream;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.util.Iterator;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.kabeja.dxf.DXFColor;
import org.kabeja.dxf.DXFDocument;
import org.kabeja.dxf.DXFEntity;
import org.kabeja.dxf.DXFLayer;
import org.kabeja.dxf.DXFLine;
import org.kabeja.dxf.DXFPoint;
import org.kabeja.dxf.DXFPolyline;
import org.kabeja.dxf.DXFText;
import org.kabeja.dxf.DXFVertex;
import org.kabeja.parser.ParseException;
import org.kabeja.parser.Parser;
import org.kabeja.parser.ParserBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DxfLoad extends HttpServlet {
	private static final String CONTENT_TYPE = "text/html; charset=UTF-8";
	private static Logger logger = LoggerFactory.getLogger(DxfLoad.class);
//REPLACE THE EPSG CODE WITH THE ONE CORESPONDS TO YOUR DXF FILE
	private static final String EPSG_CODE = "3857";
	private static final long serialVersionUID = 1L;

	public static void main(String[] args) throws FileNotFoundException {
		// TODO Auto-generated method stub

		// DECLARE THE LOCATION OF THE DXF FILE
		// THIS MAY BE SUPPLIED AS A PARAMETER TO THE SERVLET
		String filLoc = "C:\\Users\\Administrator\\Downloads\\Mechanical Sample\\Mechanical Sample.dxf";
		logger.debug(filLoc);

		String dxfParsingString = "";
		Parser parser = ParserBuilder.createDefaultParser();
		StringBuilder buffer = new StringBuilder();
		buffer.append("<wfs:FeatureCollection xmlns:wfs=\"http://www.opengis.net/wfs\">");
		try {
			InputStream in = null;
			in = new FileInputStream(filLoc);
			// PARSE THE SUPPLIED DXF FILE
			parser.parse(in, "UTF-8");

			// get the documnet and its layers
			DXFDocument doc = parser.getDocument();
			Iterator lyrsIt = doc.getDXFLayerIterator();
			int counter = 0;
			// Loop through layers found
			while (lyrsIt.hasNext()) {
				DXFLayer layer = (DXFLayer) lyrsIt.next();
				System.out.println("layername=" + layer.getName());

				String lyrname = layer.getName();
				int lyrcolor = layer.getColor();
				String rgbcolor = DXFColor.getRGBString(lyrcolor);
				String[] cols = rgbcolor.split(",");
				// convert the layer color to hex color code
				Color mycolor = new Color(Integer.parseInt(cols[0]), Integer.parseInt(cols[1]),
						Integer.parseInt(cols[2]));
				String hex = "#" + Integer.toHexString(mycolor.getRGB()).substring(2);

				Iterator lyrTypesExist = layer.getDXFEntityTypeIterator();
				while (lyrTypesExist.hasNext()) {
					String type = (String) lyrTypesExist.next();
					Iterator entities = layer.getDXFEntities(type).iterator();
					// loop through layer entities
					while (entities.hasNext()) {

						DXFEntity entity = (DXFEntity) entities.next();
						String entType = entity.getType();
						System.out.println("entType found=" + entType);

						if (entType.equals("LWPOLYLINE") || entType.equals("POLYLINE")) {
							// System.out.println("LWPOLYLINE FOUND IN LAYER "+lyrname);
							counter = counter + 1;
							DXFPolyline poly = (DXFPolyline) entity;
							int vertCount = poly.getVertexCount();
							// System.out.println("VERTS COUNT="+vertCount);
							buffer.append("<gml:featureMember xmlns:gml=\"http://www.opengis.net/gml\">");
							buffer.append(
									"<feature:features xmlns:feature=\"http://mapserver.gis.umn.edu/mapserver\" >");
							buffer.append("<feature:geometry>");
							buffer.append("<gml:LineString srsName=\"http://www.opengis.net/def/crs/EPSG/0/" + EPSG_CODE
									+ "\"><gml:coordinates xmlns:gml=\"http://www.opengis.net/gml\" decimal=\".\" cs=\",\" ts=\"\">");
							for (int i = 0; i < vertCount; i++) {
								DXFVertex vertex = poly.getVertex(i);
								double vertX = vertex.getPoint().getX();
								double vertY = vertex.getPoint().getY();
								buffer.append(vertX);
								buffer.append(",");
								buffer.append(vertY);
								buffer.append(" ");
							}
							buffer.append("</gml:coordinates></gml:LineString>");
							buffer.append("</feature:geometry>");
							buffer.append("<feature:id>");
							buffer.append(counter);
							buffer.append("</feature:id>");
							buffer.append("<feature:layername>");
							buffer.append(lyrname);
							buffer.append("</feature:layername>");
							buffer.append("<feature:type>");
							buffer.append(entType);
							buffer.append("</feature:type>");
							buffer.append("<feature:label>");
							buffer.append(" ");
							buffer.append("</feature:label>");
							buffer.append("<feature:color>");
							buffer.append(hex);
							buffer.append("</feature:color>");
							buffer.append("</feature:features>");
							buffer.append("</gml:featureMember>");
						}
						if (entType.equals("LINE")) {
							counter = counter + 1;
							// System.out.println("LINE FOUND");
							DXFLine line = (DXFLine) entity;
							double vertX1 = line.getStartPoint().getX();
							double vertY1 = line.getStartPoint().getY();
							double vertX2 = line.getEndPoint().getX();
							double vertY2 = line.getEndPoint().getY();
							buffer.append("<gml:featureMember xmlns:gml=\"http://www.opengis.net/gml\">");
							buffer.append(
									"<feature:features xmlns:feature=\"http://mapserver.gis.umn.edu/mapserver\" >");
							buffer.append("<feature:geometry>");
							buffer.append("<gml:LineString srsName=\"http://www.opengis.net/def/crs/EPSG/0/" + EPSG_CODE
									+ "\"><gml:coordinates xmlns:gml=\"http://www.opengis.net/gml\" decimal=\".\" cs=\",\" ts=\"\">");
							buffer.append(vertX1);
							buffer.append(",");
							buffer.append(vertY1);
							buffer.append(" ");
							buffer.append(vertX2);
							buffer.append(",");
							buffer.append(vertY2);
							buffer.append(" ");
							buffer.append("</gml:coordinates></gml:LineString>");
							buffer.append("</feature:geometry>");
							buffer.append("<feature:id>");
							buffer.append(counter);
							buffer.append("</feature:id>");
							buffer.append("<feature:layername>");
							buffer.append(lyrname);
							buffer.append("</feature:layername>");
							buffer.append("<feature:type>");
							buffer.append(entType);
							buffer.append("</feature:type>");
							buffer.append("<feature:label>");
							buffer.append(" ");
							buffer.append("</feature:label>");
							buffer.append("<feature:color>");
							buffer.append(hex);
							buffer.append("</feature:color>");
							buffer.append("</feature:features>");
							buffer.append("</gml:featureMember>");

						}
						if (entType.equals("POINT")) {
							counter = counter + 1;
							// System.out.println("POINT FOUND");
							DXFPoint point = (DXFPoint) entity;
							double pointX = point.getX();
							double pointY = point.getY();
							buffer.append("<gml:featureMember xmlns:gml=\"http://www.opengis.net/gml\">");
							buffer.append(
									"<feature:features xmlns:feature=\"http://mapserver.gis.umn.edu/mapserver\" >");
							buffer.append("<feature:geometry>");
							buffer.append("<gml:Point srsName=\"http://www.opengis.net/def/crs/EPSG/0/" + EPSG_CODE
									+ "\"><gml:coordinates xmlns:gml=\"http://www.opengis.net/gml\" decimal=\".\" cs=\",\" ts=\"\">");
							buffer.append(pointX);
							buffer.append(",");
							buffer.append(pointY);
							buffer.append(" ");
							buffer.append("</gml:coordinates></gml:Point>");
							buffer.append("</feature:geometry>");
							buffer.append("<feature:id>");
							buffer.append(counter);
							buffer.append("</feature:id>");
							buffer.append("<feature:layername>");
							buffer.append(lyrname);
							buffer.append("</feature:layername>");
							buffer.append("<feature:type>");
							buffer.append(entType);
							buffer.append("</feature:type>");
							buffer.append("<feature:label>");
							buffer.append(" ");
							buffer.append("</feature:label>");
							buffer.append("<feature:color>");
							buffer.append(hex);
							buffer.append("</feature:color>");
							buffer.append("</feature:features>");
							buffer.append("</gml:featureMember>");
						}
						if (entType.equals("TEXT")) {
							counter = counter + 1;
							// System.out.println("TEXT FOUND");
							DXFText text = (DXFText) entity;
							double vertX = text.getInsertPoint().getX();
							double vertY = text.getInsertPoint().getY();
							String label = text.getText().replace("\"", " ");
							buffer.append("<gml:featureMember xmlns:gml=\"http://www.opengis.net/gml\">");
							buffer.append(
									"<feature:features xmlns:feature=\"http://mapserver.gis.umn.edu/mapserver\" >");
							buffer.append("<feature:geometry>");
							buffer.append("<gml:Point srsName=\"http://www.opengis.net/def/crs/EPSG/0/" + EPSG_CODE
									+ "\"><gml:coordinates xmlns:gml=\"http://www.opengis.net/gml\" decimal=\".\" cs=\",\" ts=\"\">");
							buffer.append(vertX);
							buffer.append(",");
							buffer.append(vertY);
							buffer.append(" ");
							buffer.append("</gml:coordinates></gml:Point>");
							buffer.append("</feature:geometry>");
							buffer.append("<feature:id>");
							buffer.append(counter);
							buffer.append("</feature:id>");
							buffer.append("<feature:layername>");
							buffer.append(lyrname);
							buffer.append("</feature:layername>");
							buffer.append("<feature:type>");
							buffer.append(entType);
							buffer.append("</feature:type>");
							buffer.append("<feature:label>");
							buffer.append(label);
							buffer.append("</feature:label>");
							buffer.append("<feature:color>");
							buffer.append(hex);
							buffer.append("</feature:color>");
							buffer.append("</feature:features>");
							buffer.append("</gml:featureMember>");
						}
					}
				}
			}
			buffer.append("</wfs:FeatureCollection>");
		} catch (ParseException e) {
			e.printStackTrace();
		}
		dxfParsingString = buffer.toString();
		buffer.setLength(0); // flush it

		System.out.println(dxfParsingString);
	}
}