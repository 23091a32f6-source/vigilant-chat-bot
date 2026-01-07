# Install required packages if not already installed:
# pip install pandas scikit-learn plotly dash
C:\Users\DELL\AppData\Local\Programs\Python\Python313\python.exe

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error
import plotly.express as px
import plotly.graph_objects as go
from dash import Dash, dcc, html

# -----------------------------
# 1. Generate Synthetic Risk Data
# -----------------------------
np.random.seed(42)
n = 500
data = pd.DataFrame({
    "Age": np.random.randint(18, 70, n),
    "Income": np.random.randint(20000, 150000, n),
    "HealthScore": np.random.randint(1, 10, n),
    "DrivingHistory": np.random.randint(0, 5, n)
})

# Feature engineering: risk score
data["RiskScore"] = (
    0.4 * (70 - data["Age"]) +
    0.3 * (10 - data["HealthScore"]) +
    0.3 * (5 - data["DrivingHistory"])
)

# Premium (target variable)
data["Premium"] = (
    200 + 0.05 * data["Income"] +
    50 * (10 - data["HealthScore"]) +
    100 * data["DrivingHistory"] +
    np.random.normal(0, 100, n)
)

# -----------------------------
# 2. Train Regression Model
# -----------------------------
X = data[["Age", "Income", "HealthScore", "DrivingHistory", "RiskScore"]]
y = data["Premium"]

model = LinearRegression()
model.fit(X, y)
y_pred = model.predict(X)

r2 = r2_score(y, y_pred)
rmse = np.sqrt(mean_squared_error(y, y_pred))

# -----------------------------
# 3. Build Dashboard
# -----------------------------
app = Dash(__name__)

app.layout = html.Div([
    html.H1("Insurance Premium Pricing Optimization Dashboard"),

    # Overview
    html.Div([
        html.H2("Overview"),
        html.P("Objectives: Predict risk-adjusted premium, Identify risk drivers, Improve pricing fairness")
    ]),

    # Data Visualization
    html.Div([
        html.H2("Synthetic Risk Data"),
        dcc.Graph(figure=px.histogram(data, x="Age", nbins=20, title="Age Distribution")),
        dcc.Graph(figure=px.histogram(data, x="Income", nbins=20, title="Income Distribution")),
        dcc.Graph(figure=px.histogram(data, x="HealthScore", nbins=10, title="Health Score Distribution")),
    ]),

    # Model Performance
    html.Div([
        html.H2("Model Performance"),
        html.P(f"R²: {r2:.3f}, RMSE: {rmse:.2f}"),
        dcc.Graph(figure=px.scatter(x=y, y=y_pred, labels={"x":"Actual Premium", "y":"Predicted Premium"},
                                    title="Actual vs Predicted Premiums"))
    ]),

    # Sensitivity Analysis
    html.Div([
        html.H2("Sensitivity Analysis"),
        dcc.Graph(figure=px.bar(
            x=X.columns, y=model.coef_,
            labels={"x":"Feature", "y":"Coefficient"},
            title="Impact of Risk Drivers"
        ))
    ]),

    # Evaluation (Fairness proxy: distribution comparison)
    html.Div([
        html.H2("Evaluation"),
        dcc.Graph(figure=px.box(data, x="HealthScore", y="Premium", title="Premium Distribution by Health Score")),
        dcc.Graph(figure=px.box(data, x="DrivingHistory", y="Premium", title="Premium Distribution by Driving History"))
    ])
])

if __name__ == "__main__":
    app.run_server(debug=True)
