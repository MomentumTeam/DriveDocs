FROM mcr.microsoft.com/dotnet/core/sdk:3.1 AS build-env


# install libgdiplus for System.Drawing
RUN apt-get update && \
    apt-get install -y --allow-unauthenticated libgdiplus libc6-dev

# install x11 for System.Drawing
RUN apt-get update && \
    apt-get install -y --allow-unauthenticated libx11-dev

WORKDIR /app


# Copy everything else and build

COPY . ./

# Copy csproj and restore as distinct layers
COPY *.csproj ./

RUN dotnet restore
RUN dotnet publish -c Release -o out


# Build runtime image
FROM mcr.microsoft.com/dotnet/core/aspnet:3.1
# install libgdiplus for System.Drawing
RUN apt-get update && \
    apt-get install -y --allow-unauthenticated libgdiplus libc6-dev

# install x11 for System.Drawing
RUN apt-get update && \
    apt-get install -y --allow-unauthenticated libx11-dev
WORKDIR /app
COPY --from=build-env /app/out .
ENTRYPOINT ["dotnet", "DriveWopi.dll"]