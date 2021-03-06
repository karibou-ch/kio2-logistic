import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportingService, ReportIssues, User } from 'kng2-core';
import { EngineService } from '../services/engine.service';

@Component({
  selector: 'app-issues',
  templateUrl: './issues.page.html',
  styleUrls: ['./issues.page.scss'],
})
export class IssuesPage implements OnInit {

  format = 'MMM yyyy';
  defaultTitle: string;
  user: User;
  pickerShippingDate: string;
  currentDate: Date;
  month: number;
  year: number;

  reports: ReportIssues[];
  groups: any;

  constructor(
    private $engine: EngineService,
    private $report: ReportingService,
    private $route: ActivatedRoute,
    private $router: Router,
  ) {
  }

  ngOnInit() {
    this.user = this.$engine.currentUser;
    this.onInitReport();
  }

  //
  // on selected date
  onDatePicker() {
    const date = new Date(this.pickerShippingDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(2);

    this.pickerShippingDate = date.toISOString();
    this.currentDate = date;
    this.month = (this.currentDate.getMonth() + 1);
    this.year = (this.currentDate.getFullYear());
    this.$router.navigate(['/issues', this.month, this.year]);
    this.onInitReport();
  }

  //
  // return list of month.year labels for this report of issue
  get reportLabels() {
    return Object.keys(this.groups);
  }

  onInitReport() {
    this.reports = [];
    this.groups = {};
    const month = ('0' + (new Date(this.currentDate).getMonth() + 1)).slice(-2);
    const year = new Date(this.currentDate).getFullYear();

    //
    // this value depends on HUB
    // FIXME siteName not available on report
    // this.$report.getIssues(year, month)
    this.$report.getIssues().subscribe((reports: ReportIssues[]) => {
      // const mapped = {};
      // // tslint:disable-next-line: no-shadowed-variable
      // reports.forEach((report) => {
      //   if (!mapped[report._id.year]) { mapped[report._id.year] = {}; }
      //   if (!mapped[report._id.year][report._id.month]) { mapped[report._id.year][report._id.month] = {}; }
      //   if (!mapped[report._id.year][report._id.month][report._id.vendor]) {
      //     mapped[report._id.year][report._id.month][report._id.vendor] = {};
      //   }
      //   mapped[report._id.year][report._id.month][report._id.vendor] = (report.issues)
      // });
      document.title = this.defaultTitle;
      this.reports = reports.map(report => {
        const key = report._id.month+'.'+report._id.year;
        report['ratio'] = report.issues.length / report.orders.total;
        report['ratio_danger'] = report.issues.filter(elem => elem.issue == 'issue_missing_product_danger').length / report.orders.total;

        if(!this.groups[key]){
          this.groups[key] = [];
        }
        this.groups[key].push(report);
        return report;
      });//.sort(this.sortByRatio);

    });
  }
  

  sortByRatio(a, b) {
    const ratioa = a.issues.length / a.orders.total;
    const ratiob = b.issues.length / b.orders.total;
    return ratiob - ratioa;
  }
}
