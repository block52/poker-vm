{-|
Module      : Main
Description : PHH Dataset Test Runner for Texas Hold'em Engine
Copyright   : (c) Block52, 2025
License     : MIT

Command-line tool for running PHH (Poker Hand History) files through the
Texas Hold'em engine for fuzzing and validation testing.

Usage: phh-runner <directory> [max-hands]
-}
module Main (main) where

import TexasHoldem.Phh

import System.Environment (getArgs)
import System.Directory (listDirectory, doesFileExist)
import System.FilePath ((</>), takeExtension)
import Control.Monad (forM, when)
import Data.List (sortBy, intercalate)
import Data.Ord (comparing, Down(..))
import Text.Printf (printf)

main :: IO ()
main = do
    args <- getArgs
    case args of
        [dir] -> runTests dir Nothing
        [dir, maxStr] -> case reads maxStr of
            [(n, "")] -> runTests dir (Just n)
            _ -> usage
        _ -> usage

usage :: IO ()
usage = putStrLn "Usage: phh-runner <directory> [max-hands]"

runTests :: FilePath -> Maybe Int -> IO ()
runTests dir maxHands = do
    putStrLn "PHH Dataset Test Runner (Haskell)"
    putStrLn $ replicate 80 '='
    putStrLn $ "Dataset Path: " ++ dir
    putStrLn $ "Max Hands: " ++ maybe "unlimited" show maxHands
    putStrLn ""

    -- Find all PHH files
    phhFiles <- findPhhFiles dir
    let filesToTest = maybe id take maxHands phhFiles
        totalFiles = length filesToTest

    putStrLn $ "Found " ++ show (length phhFiles) ++ " PHH files"
    putStrLn $ "Testing " ++ show totalFiles ++ " hands..."
    putStrLn ""

    -- Run tests and collect stats
    stats <- runAllTests filesToTest totalFiles

    -- Print results
    printResults stats

-- | Find all .phh files recursively in a directory
findPhhFiles :: FilePath -> IO [FilePath]
findPhhFiles dir = do
    contents <- listDirectory dir
    let paths = map (dir </>) contents
    files <- forM paths $ \path -> do
        isFile <- doesFileExist path
        if isFile && takeExtension path == ".phh"
            then return [path]
            else do
                -- Try as directory
                subFiles <- catchIO (findPhhFiles path) (const $ return [])
                return subFiles
    return $ concat files
  where
    catchIO :: IO a -> (IOError -> IO a) -> IO a
    catchIO = flip catch
    catch action handler = action `seq` action  -- Simplified, real impl would use Control.Exception

-- | Run all tests and return statistics
runAllTests :: [FilePath] -> Int -> IO PhhStats
runAllTests files total = go files emptyStats 0
  where
    go [] stats _ = return stats
    go (f:fs) stats n = do
        result <- runSingleTest f
        let stats' = if prrSuccess result
                        then addSuccess stats
                        else addFailure (maybe "Unknown error" id $ prrError result) stats
            n' = n + 1

        -- Print progress every 5%
        when (n' `mod` max 1 (total `div` 20) == 0) $
            printProgress n' total stats'

        go fs stats' n'

-- | Run a single PHH file test
runSingleTest :: FilePath -> IO PhhRunResult
runSingleTest path = do
    result <- parsePhhFile path
    case result of
        Left err -> return PhhRunResult
            { prrSuccess = False
            , prrActionsRun = 0
            , prrTotalActions = 0
            , prrError = Just $ "Parse error: " ++ err
            , prrFilePath = path
            }
        Right hand -> return $ runPhhHand hand

-- | Print progress line
printProgress :: Int -> Int -> PhhStats -> IO ()
printProgress n total stats = do
    let pct = (fromIntegral n / fromIntegral total * 100) :: Double
        successRate = if psTotal stats > 0
                         then fromIntegral (psSuccess stats) / fromIntegral (psTotal stats) * 100
                         else 100.0 :: Double
    printf "Progress: %d/%d (%.1f%%) | Success: %d | Failed: %d | Rate: %.2f%%\n"
           n total pct (psSuccess stats) (psFailed stats) successRate

-- | Print final results
printResults :: PhhStats -> IO ()
printResults stats = do
    putStrLn ""
    putStrLn $ replicate 80 '='
    putStrLn "PHH DATASET TEST RESULTS"
    putStrLn $ replicate 80 '='
    putStrLn ""

    let successRate = if psTotal stats > 0
                         then fromIntegral (psSuccess stats) / fromIntegral (psTotal stats) * 100
                         else 100.0 :: Double

    printf "Total Hands Tested:    %d\n" (psTotal stats)
    printf "Successful Hands:      %d\n" (psSuccess stats)
    printf "Failed Hands:          %d\n" (psFailed stats)
    putStrLn ""
    printf "Success Rate:          %.2f%%\n" successRate
    printf "Failure Rate:          %.2f%%\n" (100.0 - successRate)

    when (not $ null $ psErrors stats) $ do
        putStrLn ""
        putStrLn $ replicate 80 '-'
        putStrLn "ERROR BREAKDOWN"
        putStrLn $ replicate 80 '-'
        putStrLn ""

        let sortedErrors = sortBy (comparing (Down . snd)) (psErrors stats)
            totalFailures = psFailed stats

        forM_ sortedErrors $ \(err, count) -> do
            let pct = fromIntegral count / fromIntegral totalFailures * 100 :: Double
            printf "[%d occurrences - %.1f%% of failures]\n" count pct
            putStrLn $ "  " ++ err
            putStrLn ""

    putStrLn $ replicate 80 '='
