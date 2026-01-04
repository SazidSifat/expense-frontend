'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define styles for the PDF
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#282828',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 10,
        color: '#666666',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#282828',
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    table: {
        width: '100%',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#9E3B3B',
        padding: 8,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    tableHeaderSettlement: {
        flexDirection: 'row',
        backgroundColor: '#3B9E3B',
        padding: 8,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        padding: 8,
    },
    tableRowAlt: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        padding: 8,
        backgroundColor: '#F9F9F9',
    },
    tableCell: {
        flex: 1,
        fontSize: 9,
    },
    tableCellSmall: {
        width: '12%',
        fontSize: 8,
    },
    tableCellAmount: {
        width: '12%',
        fontSize: 8,
    },
    tableCellMedium: {
        width: '18%',
        fontSize: 8,
    },
    tableCellLarge: {
        width: '23%',
        fontSize: 8,
    },
    // Settlements table specific widths
    tableCellSettlementDate: {
        width: '15%',
        fontSize: 8,
    },
    tableCellSettlementName: {
        width: '22%',
        fontSize: 8,
    },
    tableCellSettlementAmount: {
        width: '16%',
        fontSize: 8,
    },
    tableCellSettlementNote: {
        width: '25%',
        fontSize: 8,
    },
    noData: {
        fontSize: 10,
        color: '#666666',
        fontStyle: 'italic',
        marginTop: 5,
    },
    summary: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#F5F5F5',
        borderRadius: 5,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#282828',
    },
    summaryValue: {
        fontSize: 12,
        color: '#282828',
    },
    summaryValueExpense: {
        fontSize: 12,
        color: '#9E3B3B',
        fontWeight: 'bold',
    },
    summaryValueSettlement: {
        fontSize: 12,
        color: '#3B9E3B',
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#999999',
    },
});

// Type definitions
interface Expense {
    date: string;
    reason: string;
    category: string;
    amount: number;
    givers: { user: { name: string } }[];
    takers: { user: { name: string } }[];
}

interface Settlement {
    date: string;
    fromUser: { name: string };
    toUser: { name: string };
    amount: number;
    note: string;
}

interface MonthlyReportPDFProps {
    month: number;
    year: number;
    expenses: Expense[];
    settlements: Settlement[];
}

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const MonthlyReportPDF = ({ month, year, expenses, settlements }: MonthlyReportPDFProps) => {
    const monthName = months[month - 1];
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalSettlements = settlements.reduce((sum, s) => sum + (s.amount || 0), 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Monthly Report - {monthName} {year}</Text>
                    <Text style={styles.subtitle}>Generated on {new Date().toLocaleDateString()}</Text>
                </View>

                {/* Expenses Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Expenses</Text>
                    {expenses.length > 0 ? (
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={styles.tableCellSmall}>Date</Text>
                                <Text style={styles.tableCellMedium}>Description</Text>
                                <Text style={styles.tableCellSmall}>Category</Text>
                                <Text style={styles.tableCellAmount}>Amount</Text>
                                <Text style={styles.tableCellLarge}>Paid By</Text>
                                <Text style={styles.tableCellLarge}>Taken By</Text>
                            </View>
                            {expenses.map((exp, index) => (
                                <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                                    <Text style={styles.tableCellSmall}>
                                        {new Date(exp.date).toLocaleDateString()}
                                    </Text>
                                    <Text style={styles.tableCellMedium}>{exp.reason || '-'}</Text>
                                    <Text style={styles.tableCellSmall}>{exp.category || '-'}</Text>
                                    <Text style={styles.tableCellAmount}>Tk {(exp.amount || 0).toFixed(0)}</Text>
                                    <Text style={styles.tableCellLarge}>
                                        {exp.givers?.map(g => g.user?.name.split(' ')[0] || 'Unknown').join(', ') || '-'}
                                    </Text>
                                    <Text style={styles.tableCellLarge}>
                                        {exp.takers?.map(t => t.user?.name.split(' ')[0]).join(', ') || '-'}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.noData}>No expenses found for this period.</Text>
                    )}
                </View>

                {/* Settlements Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settlements</Text>
                    {settlements.length > 0 ? (
                        <View style={styles.table}>
                            <View style={styles.tableHeaderSettlement}>
                                <Text style={styles.tableCellSettlementDate}>Date</Text>
                                <Text style={styles.tableCellSettlementName}>From</Text>
                                <Text style={styles.tableCellSettlementName}>To</Text>
                                <Text style={styles.tableCellSettlementAmount}>Amount</Text>
                                <Text style={styles.tableCellSettlementNote}>Note</Text>
                            </View>
                            {settlements.map((s, index) => (
                                <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                                    <Text style={styles.tableCellSettlementDate}>
                                        {new Date(s.date).toLocaleDateString()}
                                    </Text>
                                    <Text style={styles.tableCellSettlementName}>{s.fromUser?.name || 'Unknown'}</Text>
                                    <Text style={styles.tableCellSettlementName}>{s.toUser?.name || 'Unknown'}</Text>
                                    <Text style={styles.tableCellSettlementAmount}>Tk {(s.amount || 0).toFixed(0)}</Text>
                                    <Text style={styles.tableCellSettlementNote}>{s.note || '-'}</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.noData}>No settlements found for this period.</Text>
                    )}
                </View>

                <View style={styles.summary}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Expenses:</Text>
                        <Text style={styles.summaryValueExpense}>Tk {totalExpenses.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Settlements:</Text>
                        <Text style={styles.summaryValueSettlement}>Tk {totalSettlements.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    The Monthly Report is generated by <Text style={{ fontWeight: 'bold' }}>Monthly Tri.</Text>
                </Text>
            </Page>
        </Document>
    );
};

export default MonthlyReportPDF;
